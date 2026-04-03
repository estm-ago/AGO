mod frame;
pub use frame::WSCanFrame;

use std::{
    collections::VecDeque, io::ErrorKind, sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}, mpsc}, thread, time::Duration
};
use log::{error, info, trace};
use tauri::{AppHandle, Manager};
use crate::{
    models::{
        serial_port::SerialPortManager,
        data::vehicle::{MotorSide, RpmType},
    },
    GlobalState
};

/// 內部序列埠管理結構 <br>
/// Internal struct for managing serial port operations
pub struct WSCanManager
{
    port: SerialPortManager,
    shutdown: Option<Arc<AtomicBool>>,
    pub tx_buffer: Arc<Mutex<VecDeque<WSCanFrame>>>, 
    pub rx_buffer: Arc<Mutex<VecDeque<WSCanFrame>>>,
}
impl WSCanManager {
    pub fn new(tx_buf_len: u16, rx_buf_len: u16) -> Self {
        Self {
            port: SerialPortManager::new(),
            shutdown: None,
            tx_buffer: Arc::new(Mutex::new(VecDeque::with_capacity(tx_buf_len as usize))),
            rx_buffer: Arc::new(Mutex::new(VecDeque::with_capacity(rx_buf_len as usize))),
        }
    }

    pub fn check_open(&self) -> Result<(), String> {
        self.port.check_open()
    }

    fn parse_u16_be(data: &[u8]) -> Option<u16>
    {
        let bytes: [u8; 2] = data.try_into().ok()?;
        Some(u16::from_be_bytes(bytes))
    }

    /// 將 4 個 u8 轉換為 f32 (Big Endian)，並根據 sign_flag 決定正負號
    /// sign_flag: 1 代表負數，其餘代表正數
    fn parse_f32_with_sign_be(sign_flag: u8, data: &[u8]) -> Option<f32>
    {
        let bytes: [u8; 4] = data.try_into().ok()?;
        let mut val = f32::from_be_bytes(bytes);
        if sign_flag == 1 {
            val = -val;
        }
        Some(val)
    }
    
    /// 將以空白分隔的十六進位字串轉換為 Vec<u8>
    fn hex_string_to_bytes(s: &str) -> Result<Vec<u8>, String>
    {
        s.split_whitespace()
            .map(|p| {
                // from_str_radix(字串, 16) 會嘗試將其解析為 16 進位的 u8
                u8::from_str_radix(p, 16).map_err(|_| format!("非法 hex byte: \"{}\"", p))
            })
            .collect() // collect 會自動處理 Result，如果其中一個 map 失敗，整個就會回傳 Err
    }

    /// 將單一十六進位字串轉換為 u16
    fn hex_to_uint16(hex_str: &str) -> Result<u16, String>
    {
        let trimmed = hex_str.trim();
        u16::from_str_radix(trimmed, 16)
            .map_err(|_| format!("非法的 16 位元十六進位數值: \"{}\"", trimmed))
    }

    pub fn open(
        &mut self,
        app: AppHandle,
        port_name: &str,
        baudrate: u32,
    ) -> Result<(), String> {
        // 設定較短的 timeout，避免 read 永遠阻塞無法 shutdown
        self.port.open(port_name, baudrate, 10)?;
        let mut port_reader = self.port.clone_port()?;
        let mut port_writer = self.port.clone_port()?;

        let shutdown_flag = Arc::new(AtomicBool::new(false));
        self.shutdown = Some(shutdown_flag.clone());
        // 建立讀取執行緒與切割執行緒溝通的通道 (Channel)
        // Read Thread 負責塞資料 (tx)，Slice Thread 負責拿資料 (rx)
        let (raw_data_tx, raw_data_rx) = mpsc::channel::<Vec<u8>>();

        // ==========================================
        //【純讀取執行緒】 (負責從 OS 榨乾緩衝區)
        // ==========================================
        let shutdown_read = shutdown_flag.clone();
        thread::spawn(move || {
            let mut local_buf = vec![0u8; 4096]; // 加大緩衝，最高效讀取
            loop {
                if shutdown_read.load(Ordering::Relaxed) { break; }

                match port_reader.read(&mut local_buf) {
                    Ok(n) if n > 0 => {
                        // 讀到資料，立刻打包送給 Slice 執行緒處理，絕不阻塞自己
                        let _ = raw_data_tx.send(local_buf[..n].to_vec());
                    }
                    Ok(_) => {}
                    Err(ref e) if e.kind() == ErrorKind::TimedOut => {
                        // Timeout 沒資料就繼續下一圈
                    }
                    Err(e) => {
                        error!("Port read error: {}", e);
                        thread::sleep(Duration::from_millis(10));
                    }
                }
            }
        });

        // ==========================================
        //【切割與解析執行緒】 (負責每 20 筆切一刀)
        // ==========================================
        let shutdown_slice = shutdown_flag.clone();
        let rx_buf_slice = self.rx_buffer.clone();
        thread::spawn(move || {
            let mut pending_buffer: Vec<u8> = Vec::with_capacity(4096);

            loop {
                if shutdown_slice.load(Ordering::Relaxed) { break; }

                // 從讀取執行緒接收 raw bytes (設定 50ms timeout 以便定期檢查 shutdown)
                match raw_data_rx.recv_timeout(Duration::from_millis(50))
                {
                    Ok(mut chunk) => {
                        pending_buffer.append(&mut chunk);

                        while pending_buffer.len() >= WSCanFrame::SIZE
                        {
                            // 如果開頭不是 0xAA 0x55，就丟棄第一個 byte，繼續找下一個正確的開頭
                            if pending_buffer[0] != 0xAA || pending_buffer[1] != 0x55
                            {
                                pending_buffer.remove(0);
                                continue;
                            }

                            let frame_bytes: Vec<u8> = pending_buffer.drain(0..WSCanFrame::SIZE).collect();
                            match WSCanFrame::decode(&frame_bytes)
                            {
                                Ok(frame) => {
                                    trace!("Frame decoded, ID: {}", frame.id);
                                    if let Ok(mut buf) = rx_buf_slice.lock()
                                    {
                                        buf.push_back(frame);
                                    }
                                }
                                Err(e) => {
                                    error!("WSCanFrame Decode error: {}", e);
                                }
                            }
                        }
                    }
                    Err(mpsc::RecvTimeoutError::Timeout) => { continue; } // 等待超時，重新檢查迴圈
                    Err(mpsc::RecvTimeoutError::Disconnected) => { break; } // Channel 斷開，退出
                }
            }
        });

        // ==========================================
        //【寫入執行緒】 (負責把 WSCanFrame 轉成 20 bytes 發送)
        // ==========================================
        let shutdown_write = shutdown_flag.clone();
        let tx_buf_write = self.tx_buffer.clone();
        thread::spawn(move || {
            loop {
                if shutdown_write.load(Ordering::Relaxed) { break; }
                
                // ✅ 直接從我們自己的 tx_buf_write 拿資料
                let maybe_frame = match tx_buf_write.try_lock()
                {
                    Ok(mut buf) => buf.pop_front(),
                    Err(_) => None,
                };

                if let Some(frame) = maybe_frame
                {
                    // 使用你定義好的 encode 函數產生 20 bytes 的 Vec<u8>
                    let bytes = frame.encode(); 
                    
                    if let Err(e) = port_writer.write_all(&bytes) {
                        error!("Port write failed: {}", e);
                    } else {
                        trace!("Port write succeed, ID: {}", frame.id);
                    }
                } else {
                    thread::sleep(Duration::from_millis(5)); 
                }
            }
        });

        // ==========================================
        //【特定 ID 擷取與解析執行緒】 (負責處理 ID == 140)
        // ==========================================
        let shutdown_parse = shutdown_flag.clone();
        let rx_buf_parse = self.rx_buffer.clone();
        let app_parse = app.clone();
        thread::spawn(move || {
            let global = app_parse.state::<GlobalState>();
            loop {
                if shutdown_parse.load(Ordering::Relaxed) { break; }

                let mut target_frames = Vec::new();
                if let Ok(mut buf) = rx_buf_parse.try_lock()
                {
                    let mut i = 0;
                    while i < buf.len()
                    {
                        if buf[i].id == 0x100
                        {
                            if let Some(frame) = buf.remove(i)
                            {
                                target_frames.push(frame);
                            }
                        }
                        else
                        {
                            i += 1;
                        }
                    }
                }
                let mut vd = global.vehicle_data.blocking_lock();
                for frame in target_frames
                {
                    if frame.data.len() < 8 
                    {
                        error!("ID=100 封包資料長度不足，無法解析");
                        continue;
                    }
                    let index = match Self::parse_u16_be(&frame.data[1..3])
                    {
                        Some(idx) => idx,
                        None => {
                            error!("Index 解析失敗");
                            continue; 
                        }
                    };
                    let rpm = match Self::parse_f32_with_sign_be(frame.data[3], &frame.data[4..8])
                    {
                        Some(val) => val,
                        None => {
                            error!("RPM 解析失敗");
                            continue; 
                        }
                    };
                    if frame.data[0] == 0
                    {
                        vd.motor_upd_rpm(MotorSide::Left, RpmType::Fbk, index, rpm);
                    }
                    else
                    {
                        vd.motor_upd_rpm(MotorSide::Left, RpmType::Ref, index, rpm);
                    }
                }

                // 避免 CPU 空轉 (Busy-waiting)，稍微休眠一下再檢查
                thread::sleep(Duration::from_millis(5)); 
            }
        });

        Ok(())
    }

    pub fn close(&mut self) -> Result<(), String> {
        if let Some(shutdown) = self.shutdown.take() {
            shutdown.store(true, Ordering::Relaxed);
        }
        self.port.close()
    }

    pub fn send(&mut self, id: String, data: String) -> Result<(), String>
    {
        let _id = Self::hex_to_uint16(&id).map_err(|e| e.to_string())?;
        let mut _data = Self::hex_string_to_bytes(&data).map_err(|e| e.to_string())?;
        _data.truncate(8);
        let frame = WSCanFrame {
            id: _id,
            dlc: _data.len() as u8,
            data: _data,
            extended: false,
            rtr: false,
            error: false
        };
        if let Ok(mut buf) = self.tx_buffer.lock()
        {
            buf.push_back(frame);
            Ok(())
        }
        else
        {
            Err("Failed to lock tx_buffer".into())
        }
    }
}

/// Tauri 指令：列出可用序列埠<br>
/// Tauri command: list available serial ports
#[tauri::command]
pub async fn wscan_available() -> Result<Vec<String>, String>
{
    let ports = SerialPortManager::available()?;
    let names = ports.into_iter().rev().map(|info| info.port_name).collect();
    info!("All available ports: {:?}", names);
    Ok(names)
}

/// Tauri 指令：檢查序列埠是否開啟<br>
/// Tauri command: check if the serial port is open
#[tauri::command]
pub async fn wscan_check_open(app: AppHandle) -> bool
{
    let global_state = app.state::<GlobalState>();
    let state = global_state.wscan_manager.lock().await;
    state.check_open().is_ok()
}

/// Tauri 指令：開啟序列埠<br>
/// Tauri command: open the serial port
#[tauri::command]
pub async fn wscan_open(app: AppHandle, port_name: String) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wscan_manager.lock().await;
    // 1. 去除字串前後隱藏的空白或換行符號
    let mut clean_port_name = port_name.trim().to_string();

    // 2. 針對 Windows 系統的 COM10 以上防呆處理 (加上 \\.\ 前綴)
    #[cfg(target_os = "windows")]
    if clean_port_name.starts_with("COM") && !clean_port_name.starts_with("\\\\.\\") {
        clean_port_name = format!("\\\\.\\{}", clean_port_name);
    }
    state.open(app.clone(), &clean_port_name, 2_000_000).map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    let _msg = format!("Open port succeed: {}", clean_port_name);
    info!("{}", _msg);
    Ok(_msg)
}

/// Tauri 指令：關閉序列埠<br>
/// Tauri command: close the serial port
#[tauri::command]
pub async fn wscan_close(app: AppHandle) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wscan_manager.lock().await;
    state.close().map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    let message = "Close port succeed".into();
    info!("{}", message);
    Ok(message)
}

/// Tauri 指令：將馬達資料匯出成 CSV<br>
/// Tauri command: export motor data to CSV
#[tauri::command]
pub async fn wscan_export(app: AppHandle) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    
    // 取得 vehicle_data 的非同步鎖
    let vd = global_state.vehicle_data.lock().await;

    // 指定你要求的相對路徑
    // (溫馨提示：Tauri 預設的資料夾通常是 "src-tauri"，如果你的真的是底線，請保持原樣)
    let file_path = "data_gen/data_log.csv";

    // 安全機制：確保前置資料夾 (data_gen) 存在，如果不存在就自動建立
    if let Some(parent) = std::path::Path::new(file_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            let err_msg = format!("建立資料夾失敗: {}", e);
            error!("{}", err_msg);
            return Err(err_msg);
        }
    }

    // 呼叫你在 vehicle.rs 寫好的匯出函數
    match vd.export_to_csv(file_path) {
        Ok(_) => {
            let msg = format!("資料成功匯出至: {}", file_path);
            info!("{}", msg);
            Ok(msg)
        }
        Err(e) => {
            let err_msg = format!("匯出 CSV 失敗: {}", e);
            error!("{}", err_msg);
            Err(err_msg)
        }
    }
}

#[tauri::command]
pub async fn wscan_send(app: AppHandle, id: String, data: String) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wscan_manager.lock().await;

    state.send(id, data).map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    Ok("Frame sent successfully".into())
}
