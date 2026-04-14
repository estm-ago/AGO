#[derive(Clone, Copy, Debug)]
pub struct MotorData
{
    rpm_ref: f32,
    rpm_fbk: f32,
    foc_id: f32,
    foc_iq: f32,
}
impl MotorData
{
    pub fn new() -> Self
    {
        Self
        {
            rpm_ref: 0.0,
            rpm_fbk: 0.0,
            foc_id: 0.0,
            foc_iq: 0.0,
        }
    }

    pub fn upd_rpm_ref(&mut self, rpm_ref: f32)
    {
        self.rpm_ref = rpm_ref;
    }

    pub fn upd_rpm_fbk(&mut self, rpm_fbk: f32)
    {
        self.rpm_fbk = rpm_fbk;
    }

    pub fn upd_foc_id(&mut self, foc_id: f32)
    {
        self.foc_id = foc_id;
    }

    pub fn upd_foc_iq(&mut self, foc_iq: f32)
    {
        self.foc_iq = foc_iq;
    }

    pub fn get_rpm_ref(&self) -> f32
    {
        self.rpm_ref
    }
    
    pub fn get_rpm_fbk(&self) -> f32
    {
        self.rpm_fbk
    }

    pub fn get_foc_id(&self) -> f32
    {
        self.foc_id
    }

    pub fn get_foc_iq(&self) -> f32
    {
        self.foc_iq
    }
}
