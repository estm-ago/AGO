use std::{fs::File, path::Path, io::Write};
use log::trace;
use super::motor::MotorData;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum MotorSide {
    Left,
    Right,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum RpmType {
    Ref,
    Fbk,
}

#[derive(Clone, Debug)] 
struct VehicleData {
    tick: u16,
    motor_left: MotorData,
    motor_right: MotorData,
}

pub struct VehicleDatas {
    tick: u16,
    datas: Vec<VehicleData>,
}
impl VehicleDatas {
    pub fn new(data_len: u32) -> Self
    {
        Self
        {
            tick: 0,
            datas: vec![
                VehicleData {
                    tick: 0,
                    motor_left: MotorData::new(),
                    motor_right: MotorData::new()
                };
                data_len as usize
            ],
        }
    }

    pub fn motor_upd_rpm(&mut self, side: MotorSide, rpm_type: RpmType, tick: u16, val: f32)
    {
        let len = self.datas.len();
        if len == 0 { return; }

        if let Some(data) = self.datas.get_mut(tick as usize % len)
        {
            trace!("Parsed frame ID=100, index={}", tick);
            data.tick = tick;
            
            let motor = match side {
                MotorSide::Left => &mut data.motor_left,
                MotorSide::Right => &mut data.motor_right,
            };
            match rpm_type {
                RpmType::Ref => motor.upd_rpm_ref(val),
                RpmType::Fbk => motor.upd_rpm_fbk(val),
            }
        }

        if self.tick < tick
        {
            self.tick = tick;
        }
    }

    pub fn motor_get_rpm(&self, side: MotorSide, rpm_type: RpmType, tick: u16) -> Option<f32>
    {
        let len = self.datas.len();
        if len == 0 { return None; }

        let data = self.datas.get(tick as usize % len)?;

        if data.tick != tick {
            return None;
        }
        let motor = match side
        {
            MotorSide::Left => &data.motor_left,
            MotorSide::Right => &data.motor_right,
        };

        Some(match rpm_type {
            RpmType::Ref => motor.get_rpm_ref(),
            RpmType::Fbk => motor.get_rpm_fbk(),
        })
    }

    pub fn export_to_csv<P: AsRef<Path>>(&self, file_path: P) -> std::io::Result<()> {
        // 建立檔案 (如果存在會覆蓋)
        let mut file = File::create(file_path)?;

        // 寫入 CSV 標題列 (Header)
        writeln!(file, "tick,left_rpm_ref,left_rpm_fbk,right_rpm_ref,right_rpm_fbk")?;

        // 因為 datas 是「環形緩衝區」，資料在記憶體中的順序可能與時間相反。
        // 我們先過濾出真正有被寫入過的資料，並將其重新照時間排序。
        let mut valid_data: Vec<&VehicleData> = self.datas.iter()
            // 濾掉沒用過的預設空位 (除非是真的第 0 筆)
            .filter(|d| d.tick > 0 || (d.tick == 0 && self.tick == 0)) 
            .collect();

        // 依照時間戳 (tick) 排序，這樣 MATLAB 畫圖時 X 軸才會是順向的
        valid_data.sort_by_key(|d| d.tick);

        // 逐筆將數值寫入 CSV
        for data in valid_data {
            writeln!(
                file,
                "{},{},{},{},{}",
                data.tick,
                data.motor_left.get_rpm_ref(),
                data.motor_left.get_rpm_fbk(),
                data.motor_right.get_rpm_ref(),
                data.motor_right.get_rpm_fbk()
            )?;
        }

        Ok(())
    }
}
