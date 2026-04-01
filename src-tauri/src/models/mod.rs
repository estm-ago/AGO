pub mod log_mod;
pub mod tauri_test_mod;
pub mod directory_mod;
pub mod loop_cmd_mod;
pub mod user_vec_mod;
pub mod uart_packet_mod;
pub mod uart_packet_proc_mod;
pub mod wifi_mod;
pub mod wifi_packet_mod;
pub mod wifi_packet_proc_mod;
pub mod mcu_const;
pub mod mcu_control_mod;
pub mod mcu_store_mod;
pub mod plotter_mod;
pub mod map_mod;
pub mod matlab_mod;

#[path = "serial_port/main.rs"]
pub mod serial_port;

#[path = "WSCan/main.rs"]
pub mod wscan;
