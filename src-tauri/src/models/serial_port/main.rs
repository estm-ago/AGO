use std::{time::Duration};
use log::{info};
use serialport::{available_ports, SerialPortInfo, SerialPort};

pub struct SerialPortManager
{
    handle: Option<Box<dyn SerialPort>>,
}
impl SerialPortManager
{
    /// 建立新的 UART 非同步管理器，初始化讀寫緩衝<br>
    /// Creates a new asynchronous UART manager and initializes read/write buffers
    pub fn new() -> Self {
        Self {
            handle: None,
        }
    }

    /// 列舉所有可用序列埠<br>
    /// Lists all available serial ports
    pub fn available() -> Result<Vec<SerialPortInfo>, String> {
        let ports =
            available_ports()
            .map_err(|e| {format!("Get available ports failed: {}", e)})?;
        Ok(ports)
    }

    /// 開啟指定序列埠並設定波特率<br>
    /// Opens the given serial port with the specified baud rate
    pub fn open(
        &mut self,
        port_name: &str,
        baudrate: u32,
        timeout_ms: u64,
    ) -> Result<(), String> {
        let port = serialport::new(port_name, baudrate)
            .timeout(Duration::from_millis(timeout_ms))
            .open()
            .map_err(|e| format!("Port open failed: {}", e))?;
        self.handle = Some(port);
        info!("Serial Port opened: {}", port_name);
        Ok(())
    }

    /// 關閉目前已開啟的序列埠<br>
    /// Closes the currently opened serial port
    pub fn close(&mut self) -> Result<(), String> {
        self.handle = None;
        info!("Serial Port closed");
        Ok(())
    }

    /// 檢查序列埠是否仍然開啟<br>
    /// Checks whether the serial port is still open
    pub fn check_open(&self) -> Result<(), String> {
        if self.handle.is_some() {
            Ok(())
        } else {
            Err("Port is not open".to_string())
        }
    }

    pub fn clone_port(&self) -> Result<Box<dyn serialport::SerialPort>, String> {
        if let Some(port) = &self.handle
        {
            port.try_clone().map_err(|e| format!("Clone port failed: {}", e))
        }
        else
        {
            Err("Port is not open".to_string())
        }
    }
}
