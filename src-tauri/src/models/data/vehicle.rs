use std::{fs::File, io::Write, path::Path, u32};
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

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum IdqType {
    Id,
    Iq,
}

#[derive(Clone, Debug)] 
struct VehicleData {
    tick: u32,
    motor_left: MotorData,
    motor_right: MotorData,
}

pub struct VehicleDatas {
    tick: u32,
    latest_index: usize,
    datas: Vec<VehicleData>,
}
impl VehicleDatas {
    pub fn new(data_len: u32) -> Self
    {
        Self
        {
            tick: u32::MAX,
            latest_index: 0,
            datas: vec![
                VehicleData {
                    tick: u32::MAX,
                    motor_left: MotorData::new(),
                    motor_right: MotorData::new()
                };
                data_len as usize
            ],
        }
    }

    pub fn reset(&mut self)
    {
        self.tick = u32::MAX;
        self.latest_index = 0;
        for data in self.datas.iter_mut()
        {
            data.tick = u32::MAX;
            data.motor_left = MotorData::new();
            data.motor_right = MotorData::new();
        }
    }

    /// 核心邏輯：根據傳入的 tick，找到對應的陣列元素進行修改。
    /// 如果是新的 tick，就覆蓋最舊的元素；如果是舊的 tick，就往回找。
    fn get_or_create_data(&mut self, target_tick: u32) -> Option<&mut VehicleData>
    {
        let len = self.datas.len();
        if len == 0 { return None; }

        // 判斷是否為啟動或 reset 後的初始狀態
        // 如果最新的一筆資料 tick 還是初始值 u32::MAX，代表這是我們收到的第一筆合法資料
        if self.tick == u32::MAX
        {
            self.tick = target_tick; // 設定初始基準時間
            let data = &mut self.datas[self.latest_index];
            data.tick = target_tick;
            return Some(data);
        }

        // 判斷 target_tick 是否為「未來的新資料」
        // 使用 1,000,000 作為歸零 (Rollover) 的判斷閾值
        let is_newer = if target_tick > self.tick
        {
            // 正常情況：target 比較大。
            // 但如果大太多 (例如 target=9,999,995, self=5)，代表它是歸零前的「舊」遲到封包
            target_tick - self.tick < 1_000_000
        }
        else
        {
            // target 比較小。
            // 如果小太多 (例如 self=9,999,995, target=5)，代表發生了歸零，target 是「新」封包
            self.tick - target_tick > 1_000_000
        };

        if is_newer
        {
            // 收到新資料 (正常推進，或剛發生歸零)
            let new_index = (self.latest_index + 1) % len;
            self.tick = target_tick;
            self.latest_index = new_index;

            let data = &mut self.datas[new_index];
            data.tick = target_tick;
            return Some(data);
        }
        else
        {
            // 收到舊資料 (亂序、遲到，或剛歸零時收到的歸零前封包)
            let mut search_index = self.latest_index;
            for _ in 0..len {
                if self.datas[search_index].tick == target_tick {
                    return Some(&mut self.datas[search_index]);
                }
                search_index = if search_index == 0 { len - 1 } else { search_index - 1 };
            }
            return None;
        }
    }

    pub fn motor_upd_rpm(&mut self, side: MotorSide, rpm_type: RpmType, tick: u32, val: f32)
    {
        if let Some(data) = self.get_or_create_data(tick)
        {
            let motor = match side {
                MotorSide::Left => &mut data.motor_left,
                MotorSide::Right => &mut data.motor_right,
            };
            match rpm_type {
                RpmType::Ref => motor.upd_rpm_ref(val),
                RpmType::Fbk => motor.upd_rpm_fbk(val),
            }
        }
    }

    pub fn motor_get_rpm(&self, side: MotorSide, rpm_type: RpmType, tick: u32) -> Option<f32>
    {
        let len = self.datas.len();
        if len == 0 { return None; }

        let mut search_index = self.latest_index;
        for _ in 0..len {
            if self.datas[search_index].tick == tick {
                let motor = match side {
                    MotorSide::Left => &self.datas[search_index].motor_left,
                    MotorSide::Right => &self.datas[search_index].motor_right,
                };
                return Some(match rpm_type {
                    RpmType::Ref => motor.get_rpm_ref(),
                    RpmType::Fbk => motor.get_rpm_fbk(),
                });
            }
            search_index = if search_index == 0 { len - 1 } else { search_index - 1 };
        }
        None
    }

    pub fn motor_upd_idq(&mut self, side: MotorSide, idq_type: IdqType, tick: u32, val: [f32; 5])
    {
        
        if let Some(data) = self.get_or_create_data(tick)
        {
            let motor = match side {
                MotorSide::Left => &mut data.motor_left,
                MotorSide::Right => &mut data.motor_right,
            };
            match idq_type {
                IdqType::Id => motor.upd_foc_id(val),
                IdqType::Iq => motor.upd_foc_iq(val),
            }
        }
    }

    pub fn export_to_csv<P: AsRef<Path>>(&self, file_path: P) -> std::io::Result<()>
    {
        // 建立檔案 (如果存在會覆蓋)
        let mut file = File::create(file_path)?;

        // 寫入 CSV 標題列 (Header)
        writeln!(file, "tick,left_rpm_ref,left_rpm_fbk,left_id,left_iq,right_rpm_ref,right_rpm_fbk,right_id,right_iq")?;

        // 因為 datas 是「環形緩衝區」，資料在記憶體中的順序可能與時間相反。
        // 我們先過濾出真正有被寫入過的資料，並將其重新照時間排序。
        let mut valid_data: Vec<&VehicleData> = self.datas.iter()
            .filter(|d| d.tick != u32::MAX) .collect();

        // 依照時間戳 (tick) 排序，這樣 MATLAB 畫圖時 X 軸才會是順向的
        valid_data.sort_by_key(|d| d.tick);

        let fmt_val = |v: f32| -> String {
            if v == f32::MAX {
                String::from("#N/A")
            } else {
                v.to_string()
            }
        };

        // 逐筆將數值寫入 CSV
        for data in valid_data {
            let left_id = data.motor_left.get_foc_id();
            let left_iq = data.motor_left.get_foc_iq();
            writeln!(
                file,
                "{},{},{},{},{}\n,,,{},{}\n,,,{},{}\n,,,{},{}\n,,,{},{}",
                data.tick,
                data.motor_left.get_rpm_ref(),
                data.motor_left.get_rpm_fbk(),
                fmt_val(left_id[0]), fmt_val(left_iq[0]),
                fmt_val(left_id[1]), fmt_val(left_iq[1]),
                fmt_val(left_id[2]), fmt_val(left_iq[2]),
                fmt_val(left_id[3]), fmt_val(left_iq[3]),
                fmt_val(left_id[4]), fmt_val(left_iq[4])
            )?;
        }
        Ok(())
    }
}
