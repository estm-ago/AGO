#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

mod fdcan_c;
use fdcan_c::{
    CAN_EFF_FLAG,
    DEVICE_HANDLE, CHANNEL_HANDLE, ZCAN_TransmitFD_Data, ZCAN_ReceiveFD_Data, ZCAN_CHANNEL_INIT_CONFIG,
    ZCAN_OpenDevice, ZCAN_CloseDevice, ZCAN_SetAbitBaud, ZCAN_SetDbitBaud, ZCAN_InitCAN, ZCAN_StartCAN,
    ZCAN_TransmitFD, ZCAN_GetReceiveNum, ZCAN_ReceiveFD,
};

use serde::Serialize;
use std::{
    cmp, collections::VecDeque, io::ErrorKind, mem::{self, size_of}, thread, time::Duration,
    sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}, mpsc}
};
use log::{error, info, trace};
use tauri::{AppHandle, Manager, Emitter};
use crate::{
    models::{
        data::vehicle::{MotorSide, RpmType, IdqType},
    },
    GlobalState
};

pub struct WSFdCanManager
{
    device: usize,
    channel: usize,
    shutdown: Option<Arc<AtomicBool>>,
    pub tx_buffer: Arc<Mutex<VecDeque<ZCAN_TransmitFD_Data>>>, 
    pub rx_buffer: Arc<Mutex<VecDeque<ZCAN_ReceiveFD_Data>>>,
}
#[derive(Clone, Serialize)]
pub struct CanFdMessage {
    pub can_id: String,
    pub data: String,
    pub length: u8,
}
impl WSFdCanManager
{
    pub fn new(tx_buffer_size: usize, rx_buffer_size: usize) -> Self
    {
        WSFdCanManager {
            device: 0,
            channel: 0,
            shutdown: None,
            tx_buffer: Arc::new(Mutex::new(VecDeque::with_capacity(tx_buffer_size))),
            rx_buffer: Arc::new(Mutex::new(VecDeque::with_capacity(rx_buffer_size))),
        }
    }

    fn parse_u32_be(data: &[u8]) -> Option<u32>
    {
        let bytes: [u8; 4] = data.try_into().ok()?;
        Some(u32::from_be_bytes(bytes))
    }

    fn parse_f32_be(data: &[u8]) -> Option<f32>
    {
        let bytes: [u8; 4] = data.try_into().ok()?;
        let val = f32::from_be_bytes(bytes);
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

    /// 將單一十六進位字串轉換為 u32
    fn hex_to_uint32(hex_str: &str) -> Result<u32, String>
    {
        let trimmed = hex_str.trim();
        u32::from_str_radix(trimmed, 16)
            .map_err(|_| format!("非法的 32 位元十六進位數值: \"{}\"", trimmed))
    }

    fn get_fd_id(can_id: u32) -> u32
    {
        can_id & 0x1FFFFFFF
    }

    fn set_fd_id(can_id: u32) -> u32
    {
        can_id | CAN_EFF_FLAG
    }

    pub fn check_open(&self) -> Result<(), String>
    {
        if self.device == 0 || self.device == usize::MAX {
            return Err("Device not open".to_string());
        }
        Ok(())
    }

    pub fn open(&mut self, device_type: u32, device_index: u32) -> Result<usize, String>
    {
        unsafe {
            let handle = ZCAN_OpenDevice(device_type, device_index, 0);
            let handle_val = handle as usize;
            
            if handle_val == 0 || handle_val == usize::MAX {
                return Err("Device open failed, please check if the USB is plugged in or the model is correct.".to_string());
            }

            self.device = handle_val;
            Ok(handle_val)
        }
    }

    pub fn close(&mut self) -> Result<(), String>
    {
        unsafe {
            let handle = self.device as DEVICE_HANDLE;
            let status = ZCAN_CloseDevice(handle);
            
            if status != 1 {
                return Err("Device close failed".to_string());
            }

            self.device = 0;
            Ok(())
        }
    }

    pub fn init_channel(
        &mut self,
        channel_index: u32,
        abit_baud: u32, // 例如 500000 (500kbps)
        dbit_baud: u32,
    ) -> Result<usize, String> {
        unsafe {
            let dev_handle = self.device as DEVICE_HANDLE;

            // 1. 設定 CAN-FD 雙波特率
            let abit_res = ZCAN_SetAbitBaud(dev_handle, channel_index, abit_baud);
            let dbit_res = ZCAN_SetDbitBaud(dev_handle, channel_index, dbit_baud);
            if abit_res != 1 || dbit_res != 1 {
                return Err("Baud rate setting failed".to_string());
            }

            // 2. 初始化通道配置
            // 使用 std::mem::zeroed() 將所有欄位先初始化為 0
            let mut cfg: ZCAN_CHANNEL_INIT_CONFIG = mem::zeroed();
            cfg.can_type = 1; // 1 代表 TYPE_CANFD

            // 處理 bindgen 產生的 union 匿名結構
            cfg.__bindgen_anon_1.canfd.acc_code = 0;
            cfg.__bindgen_anon_1.canfd.acc_mask = 0xFFFFFFFF;
            cfg.__bindgen_anon_1.canfd.filter = 0; 
            cfg.__bindgen_anon_1.canfd.mode = 0;

            // 取得 Channel Handle
            let ch_handle = ZCAN_InitCAN(dev_handle, channel_index, &mut cfg);
            let ch_handle_val = ch_handle as usize;
            if ch_handle_val == 0 || ch_handle_val == usize::MAX {
                return Err("Channel initialization failed".to_string());
            }

            // 3. 啟動通道
            let start_res = ZCAN_StartCAN(ch_handle);
            if start_res != 1 {
                return Err("Channel start failed".to_string());
            }
            fdcan_c::ZCAN_ClearBuffer(ch_handle);

            self.channel = ch_handle_val;
            Ok(ch_handle_val)
        }
    }

    fn transmit(channel: usize, mut pkt: ZCAN_TransmitFD_Data) -> Result<String, String>
    {
        unsafe {
            // 確認通道已經初始化
            let ch_handle = channel as CHANNEL_HANDLE;
            if ch_handle.is_null() {
                return Err("Channel unopen".to_string());
            }

            // 直接呼叫底層 API 發送 (最後一個參數 1 代表我們只發送 1 幀資料)
            // 注意：底層 API 需要可變參考 &mut transmit_data
            let result = ZCAN_TransmitFD(ch_handle, &mut pkt, 1);
            if result != 1 {
                return Err("Transmit failed".to_string());
            }
            Ok(format!("Transmit successful (length: {})", pkt.frame.len))
        }
    }

    fn receive(channel: usize) -> Result<Vec<ZCAN_ReceiveFD_Data>, String>
    {
        unsafe {
            let ch_handle = channel as CHANNEL_HANDLE;
            if ch_handle.is_null() {
                return Err("Channel unopen".to_string());
            }
            // 取得緩衝區內的未讀 CAN-FD 封包數量 (第二個參數 1 代表 TYPE_CANFD)
            let unread_num = ZCAN_GetReceiveNum(ch_handle, 1);
            if unread_num == 0 {
                return Ok(vec![]); 
            }
            let read_count = 50; // cmp::min(unread_num, 50);
            let mut rx_data: Vec<ZCAN_ReceiveFD_Data> = vec![mem::zeroed(); read_count as usize];
            let receive_num = ZCAN_ReceiveFD(ch_handle, rx_data.as_mut_ptr(), read_count, 50);
            if receive_num > 0 {
                rx_data.truncate(receive_num as usize);
                Ok(rx_data)
            } else {
                Ok(vec![])
            }
        }
    }

    fn analyze_data(app: AppHandle, pkt: ZCAN_ReceiveFD_Data) -> Result<(), String>
    {
        let _id = Self::get_fd_id(pkt.frame.can_id);
        if _id != 0x100 { return Ok(()); }
        if pkt.frame.len < (size_of::<u32>() + size_of::<f32>() * 4) as u8 { return Ok(()); }
        let global = app.state::<GlobalState>();
        let mut vd = global.vehicle_data.blocking_lock();

        let tick = Self::parse_u32_be(&pkt.frame.data[0..4]).ok_or("Failed to parse tick")?;

        let mut val = Self::parse_f32_be(&pkt.frame.data[4..8]).ok_or("Failed to parse rpm ref")?;
        vd.motor_upd_rpm(MotorSide::Left, RpmType::Ref, tick, val);
        val = Self::parse_f32_be(&pkt.frame.data[8..12]).ok_or("Failed to parse rpm fbk")?;
        vd.motor_upd_rpm(MotorSide::Left, RpmType::Fbk, tick, val);

        val = Self::parse_f32_be(&pkt.frame.data[12..16]).ok_or("Failed to parse idq id")?;
        vd.motor_upd_idq(MotorSide::Left, IdqType::Id, tick, val);
        val = Self::parse_f32_be(&pkt.frame.data[16..20]).ok_or("Failed to parse idq iq")?;
        vd.motor_upd_idq(MotorSide::Left, IdqType::Iq, tick, val);

        Ok(())
    }

    pub fn start_thread(&mut self, app: AppHandle) -> Result<(), String>
    {
        let shutdown_flag = Arc::new(AtomicBool::new(false));
        self.shutdown = Some(shutdown_flag.clone());
        let shutdown_read = shutdown_flag.clone();
        let rx_buffer_clone = self.rx_buffer.clone();
        let app_rx = app.clone();
        let rx_channel = self.channel;
        thread::spawn(move || {
            info!("Rx Thread started");
            while !shutdown_read.load(Ordering::Relaxed)
            {
                // CAN-FD 速度很快，建議改為 20ms ~ 50ms 輪詢一次
                thread::sleep(Duration::from_millis(50));

                // 呼叫我們剛剛改寫的 receive 靜態方法
                match Self::receive(rx_channel)
                {
                    Ok(msg) if !msg.is_empty() => {
                        let mut frontend_msgs = Vec::with_capacity(msg.len());
                        
                        // 存入後端的 rx_buffer
                        let mut buffer = rx_buffer_clone.lock().unwrap();
                        for msg in &msg {
                            buffer.push_back(*msg);
                            trace!("Received CAN-FD Frame: ID=0x{:X}, Data={:?}, Length={}",
                                Self::get_fd_id(msg.frame.can_id), &msg.frame.data[..msg.frame.len as usize], msg.frame.len);
                            
                            // 轉換為前端看得懂的 JSON
                            let frame = msg.frame;
                            let mut data_hex = String::new();
                            for i in 0..frame.len as usize {
                                data_hex.push_str(&format!("{:02X} ", frame.data[i]));
                            }
                            frontend_msgs.push(CanFdMessage {
                                can_id: format!("{:X}", Self::get_fd_id(frame.can_id)),
                                data: data_hex.trim().to_string(),
                                length: frame.len,
                            });
                        }

                        // 3. 直接透過 Tauri 系統推播給前端
                        if let Err(e) = app_rx.emit("wsfdcan-response", frontend_msgs) {
                            error!("Failed to emit event to frontend: {}", e);
                        }
                    }
                    Ok(_) => {} // 沒收到新資料，直接忽略
                    Err(e) => {
                        error!("Rx Thread encountered an error: {}", e);
                    }
                }
            }
            info!("Rx Thread exiting safely");
        });

        let shutdown_send = shutdown_flag.clone();
        let tx_buffer_clone = self.tx_buffer.clone();
        let tx_channel = self.channel;
        thread::spawn(move || {
            info!("Tx Thread started");
            while !shutdown_send.load(Ordering::Relaxed)
            {
                // CAN-FD 速度很快，建議改為 20ms ~ 50ms 輪詢一次
                thread::sleep(Duration::from_millis(50));

                // 嘗試鎖定 tx_buffer 並取出第一筆資料
                let mut data_opt = None;
                if let Ok(mut buf) = tx_buffer_clone.lock() {
                    data_opt = buf.pop_front();
                }

                // 如果有資料要發送，就呼叫 transmit
                if let Some(tx_data) = data_opt
                {
                    match Self::transmit(tx_channel, tx_data)
                    {
                        Ok(msg) => info!("WsFdCan write succeed: {}", msg),
                        Err(e) => error!("WsFdCan write failed: {}", e),
                    }
                }
            }
            info!("Tx Thread exiting safely");
        });

        let shutdown_analyze = shutdown_flag.clone();
        let analyze_buffer_clone = self.rx_buffer.clone();
        let app_analyze = app.clone();
        thread::spawn(move || {
            info!("Analyze Thread started");
            while !shutdown_analyze.load(Ordering::Relaxed)
            {
                // CAN-FD 速度很快，建議改為 20ms ~ 50ms 輪詢一次
                thread::sleep(Duration::from_millis(10));

                // 迴圈不斷從 buffer 取出資料，直到 buffer 為空
                loop {
                    let mut data_opt = None;
                    
                    // 鎖定 buffer，取出一筆資料後立刻釋放鎖，避免長時間佔用
                    if let Ok(mut buf) = analyze_buffer_clone.lock() {
                        data_opt = buf.pop_front();
                    }

                    // 如果有取到資料，就進行分析
                    if let Some(analyze_data) = data_opt
                    {
                        // app_analyze 在迴圈中需要不斷被使用，所以這裡傳入 clone
                        match Self::analyze_data(app_analyze.clone(), analyze_data)
                        {
                            Ok(_) => {
                                // 分析成功，可以選擇不印 log，或者印出較低層級的 trace
                                // trace!("WsFdCan analyze succeed");
                            },
                            Err(e) => {
                                error!("WsFdCan analyze failed: {}", e);
                            }
                        }
                    } else { break; }
                }
            }
            info!("Analyze Thread exiting safely");
        });
        Ok(())
    }

    pub fn stop_thread(&mut self)
    {
        if let Some(flag) = &self.shutdown {
            flag.store(true, Ordering::Relaxed);
        }
        self.shutdown = None;
    }

    pub fn send(&mut self, id: String, data: String) -> Result<(), String>
    {
        let mut _id = Self::hex_to_uint32(&id).map_err(|e| e.to_string())?;
        if _id > 0x1FFFFFFF {
            return Err(format!("ID out of range (0x000 ~ 0x1FFFFFFF): \"{}\"", id));
        }
        _id = Self::set_fd_id(_id);
        let mut _data = Self::hex_string_to_bytes(&data).map_err(|e| e.to_string())?;
        _data.truncate(64);
        // 建立 ZCAN_TransmitFD_Data 結構
        let mut transmit_data: ZCAN_TransmitFD_Data = unsafe { mem::zeroed() };
        transmit_data.transmit_type = 0; // 0: 正常發送
        transmit_data.frame.can_id = _id;
        transmit_data.frame.len = _data.len() as u8;
        transmit_data.frame.flags = 0; // 1: 啟用 BRS (Bit Rate Switch) 雙波特率
        
        for i in 0.._data.len() {
            transmit_data.frame.data[i] = _data[i];
        }
        if let Ok(mut buf) = self.tx_buffer.lock()
        {
            buf.push_back(transmit_data);
            Ok(())
        }
        else
        {
            Err("Failed to lock tx_buffer".into())
        }
    }
}

#[tauri::command]
pub async fn wsfdcan_check_open(app: AppHandle) -> bool
{
    let global_state = app.state::<GlobalState>();
    let state = global_state.wsfdcan_manager.lock().await;
    state.check_open().is_ok()
}

#[tauri::command]
pub async fn wsfdcan_open(app: AppHandle) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wsfdcan_manager.lock().await;
    let handle_val = state.open(41, 0).map_err(|e| {
        error!("{}", e);
        e
    })?;
    state.init_channel(0, 500_000, 500_000).map_err(|e| {
        error!("{}", e);
        e
    })?;
    state.start_thread(app.clone()).map_err(|e| {
        error!("{}", e);
        e
    })?;
    let _msg = format!("Device open succeed: {}", handle_val);
    info!("{}", _msg);
    Ok(_msg)
}

#[tauri::command]
pub async fn wsfdcan_close(app: AppHandle) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wsfdcan_manager.lock().await;
    state.stop_thread();
    state.close().map_err(|e| {
        error!("{}", e);
        e
    })?;
    let _msg = format!("Device close succeed");
    info!("{}", _msg);
    Ok(_msg)
}

#[tauri::command]
pub async fn wsfdcan_send(app: AppHandle, id: String, data: String) -> Result<String, String>
{
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.wsfdcan_manager.lock().await;
    
    // 呼叫 send 將資料塞入 tx_buffer
    state.send(id, data).map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    let _msg = format!("Frame sent successfully");
    info!("{}", _msg);
    Ok(_msg)
}
