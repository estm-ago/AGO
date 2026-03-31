interface MotorData
{
  rpm_ref: number;
  rpm_fbk: number;
}

interface VehicleData
{
  tick: number;
  motorLeft: MotorData;
  motorRight: MotorData;
}

export type {
  MotorData,
  VehicleData,
};
