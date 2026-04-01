mod frame;
pub use frame::WSCanFrame;

use std::{
    io::ErrorKind,
    sync::{Arc, atomic::{AtomicBool, Ordering}},
    thread, time::Duration
};
use log::{debug, error, info, trace};
use tauri::{AppHandle, Manager};
use crate::{
    models::{uart_packet_mod::{self, UartPacket}, serial_port::SerialPortManager},
    GlobalState
};

/// 非同步讀取單一位元組的超時值（µs）<br>
/// Default timeout for each byte read in µs
const UART_TIMEOUT_MS: u64 = 10;

/// 最大接收緩衝區大小（包含起始與結尾碼）<br>
/// Maximum receive buffer size (including start and end codes)
const MAX_RECEIVE_BUFFER_SIZE: usize = uart_packet_mod::UART_PACKET_MAX_SIZE;

/// 內部序列埠管理結構 <br>
/// Internal struct for managing serial port operations
pub struct WSCanManager
{
    port: SerialPortManager,
    shutdown: Option<Arc<AtomicBool>>,
}
impl WSCanManager {
    /// 建立內部管理實例 <br>
    /// Creates the inner manager instance
    pub fn new() -> Self {
        Self {
            port: SerialPortManager::new(),
            shutdown: None,
        }
    }

    pub fn check_open(&self) -> Result<(), String> {
        self.port.check_open()
    }

    pub fn open(
        &mut self,
        app: AppHandle,
        port_name: &str,
        baudrate: u32,
    ) -> Result<(), String> {
        // 1. 使用你的 SerialPortManager 開啟序列埠 (設定 10ms Timeout 供讀取判定用)
        self.port.open(port_name, baudrate, UART_TIMEOUT_MS)?;

        // 2. 為了讓不同執行緒同時讀寫，我們必須 Clone 序列埠控制代碼
        // (注意：需要在你的 SerialPortManager 中實作 try_clone_port 函數，見最下方說明)
        let mut port_reader = self.port.clone_port()?;
        let mut port_writer = self.port.clone_port()?;

        // 3. 建立關閉旗標
        let _shutdown = Arc::new(AtomicBool::new(false));
        self.shutdown = Some(_shutdown.clone());

        // ==========================================
        // 4. 啟動【專屬讀取執行緒】(Native OS Thread)
        // ==========================================
        let shutdown_read = _shutdown.clone();
        let app_read = app.clone();
        
        thread::spawn(move ||
        {
            let mut local_buf = vec![0u8; 1024]; // 每次最多讀 1KB
            let mut packet_buffer = Vec::with_capacity(MAX_RECEIVE_BUFFER_SIZE);

            loop {
                // 檢查是否收到關閉訊號
                if shutdown_read.load(Ordering::Relaxed) { break; }

                // 阻塞式讀取
                match port_reader.read(&mut local_buf) {
                    Ok(n) if n > 0 => {
                        // 收到資料先塞進 Buffer，繼續高速抓取下一把
                        packet_buffer.extend_from_slice(&local_buf[..n]);
                    }
                    Ok(_) => {}
                    Err(ref e) if e.kind() == ErrorKind::TimedOut => {
                        // 發生 Timeout！代表發送端有一段時間沒送資料了 (Idle-line)
                        // 這時候就可以把目前累積的 buffer 拿去 Pack
                        if !packet_buffer.is_empty() {
                            match UartPacket::pack(packet_buffer.clone()) {
                                Ok(packet) => {
                                    info!("Port read succeed:\n{}", packet.show());
                                    
                                    // 將資料透過 Tokio spawn 送回 Async 的 GlobalState
                                    let packet_clone = packet.clone();
                                    let app_async = app_read.clone();
                                    tokio::spawn(async move {
                                        let gs = app_async.state::<GlobalState>();
                                        let mut state_buffer = gs.uart_receive_buffer.lock().await;
                                        if let Err(e) = state_buffer.push(packet_clone) {
                                            error!("Packet store failed: {}", e);
                                        }
                                    });
                                }
                                Err(e) => trace!("Pack error: {}", e),
                            }
                            // 解析完畢或失敗都清空，準備接下一個封包
                            packet_buffer.clear(); 
                        }
                    }
                    Err(e) => {
                        error!("Port read error: {}", e);
                        thread::sleep(Duration::from_millis(10));
                    }
                }
            }
        });

        // ==========================================
        // 5. 啟動【專屬寫入執行緒】(Native OS Thread)
        // ==========================================
        let shutdown_write = _shutdown.clone();
        let app_write = app;

        thread::spawn(move || {
            loop {
                // 檢查是否收到關閉訊號
                if shutdown_write.load(Ordering::Relaxed) { break; }

                let gs = app_write.state::<GlobalState>();
                
                // 使用 try_lock 避免在 std::thread 中死鎖 tokio 資源
                let maybe_pkt = match gs.uart_transmit_buffer.try_lock() {
                    Ok(mut buf) => buf.pop_front().ok(),
                    Err(_) => None,
                };

                if let Some(packet) = maybe_pkt {
                    let bytes = packet.unpack();
                    if let Err(e) = port_writer.write_all(&bytes) {
                        error!("Port write failed: {}", e);
                    } else {
                        debug!("Port write succeed:\n{}", packet.show());
                    }
                } else {
                    // 如果沒有資料要寫，稍微休眠避免吃滿 CPU
                    thread::sleep(Duration::from_millis(5)); 
                }
            }
        });

        Ok(())
    }

    /// 關閉序列埠並叫停背景執行緒
    pub fn close(&mut self) -> Result<(), String> {
        // 發送訊號讓 background threads 結束
        if let Some(shutdown) = self.shutdown.take() {
            shutdown.store(true, Ordering::Relaxed);
        }
        // 呼叫底層關閉
        self.port.close()
    }
}

/// Tauri 指令：列出可用序列埠<br>
/// Tauri command: list available serial ports
#[tauri::command]
pub async fn serial_port_available() -> Result<Vec<String>, String> {
    let ports = SerialPortManager::available()?;
    let names = ports.into_iter().rev().map(|info| info.port_name).collect();
    info!("All available ports: {:?}", names);
    Ok(names)
}

/// Tauri 指令：檢查序列埠是否開啟<br>
/// Tauri command: check if the serial port is open
#[tauri::command]
pub async fn serial_port_check_open(app: AppHandle) -> bool {
    let global_state = app.state::<GlobalState>();
    let state = global_state.uart_manager.lock().await;
    state.check_open().is_ok()
}

/// Tauri 指令：開啟序列埠<br>
/// Tauri command: open the serial port
#[tauri::command]
pub async fn serial_port_open(app: AppHandle, port_name: String) -> Result<String, String> {
    let global_state = app.state::<GlobalState>();
    let mut state = global_state.uart_manager.lock().await;
    state.open(&port_name, 2_000_000, 1000).map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    let _msg = format!("Open port succeed: {}", port_name);
    info!("{}", _msg);
    Ok(_msg)
}

/// Tauri 指令：關閉序列埠<br>
/// Tauri command: close the serial port
#[tauri::command]
pub async fn serial_port_close(app: AppHandle) -> Result<String, String> {
    let global_state = app.state::<GlobalState>();
    let mut port = global_state.uart_manager.lock().await;
    port.close().map_err(|e| {
        error!("{}", e);
        e.clone()
    })?;
    let message = "Close port succeed".into();
    info!("{}", message);
    Ok(message)
}
