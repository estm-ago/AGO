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

pub struct VehicleData
{
    pub tick: u32,
    pub motor_left: Vec<MotorData>,
    pub motor_right: Vec<MotorData>,
}
impl VehicleData
{
    pub fn new(data_len: u32) -> Self
    {
        Self
        {
            tick: 0,
            motor_left:  vec![MotorData::new(); data_len as usize],
            motor_right: vec![MotorData::new(); data_len as usize],
        }
    }

    pub fn motor_upd_rpm(&mut self, side: MotorSide, rpm_type: RpmType, index: usize, val: f32)
    {
        let motor_vec = match side
        {
            MotorSide::Left => &mut self.motor_left,
            MotorSide::Right => &mut self.motor_right,
        };

        if let Some(motor) = motor_vec.get_mut(index)
        {
            match rpm_type
            {
                RpmType::Ref => motor.upd_rpm_ref(val),
                RpmType::Fbk => motor.upd_rpm_fbk(val),
            }
        }
    }

    pub fn motor_get_rpm(&self, side: MotorSide, rpm_type: RpmType, index: usize) -> Option<f32>
    {
        let motor_vec = match side
        {
            MotorSide::Left => &self.motor_left,
            MotorSide::Right => &self.motor_right,
        };

        motor_vec.get(index).map(|motor| match rpm_type
        {
            RpmType::Ref => motor.get_rpm_ref(),
            RpmType::Fbk => motor.get_rpm_fbk(),
        })
    }
}
