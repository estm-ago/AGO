use log::trace;

#[derive(Clone, Copy, Debug)]
pub struct MotorData
{
    rpm_ref: f32,
    rpm_fbk: f32,
}
impl MotorData
{
    pub fn new() -> Self
    {
        Self
        {
            rpm_ref: 0.0,
            rpm_fbk: 0.0,
        }
    }

    pub fn upd_rpm_ref(&mut self, rpm_ref: f32)
    {
        self.rpm_ref = rpm_ref;
        trace!("MotorData::upd_rpm_ref: rpm_ref updated to {}", rpm_ref);
    }

    pub fn upd_rpm_fbk(&mut self, rpm_fbk: f32)
    {
        self.rpm_fbk = rpm_fbk;
        trace!("MotorData::upd_rpm_fbk: rpm_fbk updated to {}", rpm_fbk);
    }

    pub fn get_rpm_ref(&self) -> f32
    {
        self.rpm_ref
    }
    
    pub fn get_rpm_fbk(&self) -> f32
    {
        self.rpm_fbk
    }
}
