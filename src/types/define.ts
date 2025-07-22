const CmdB0 = {
  VehicleControl: 0x21,
  WheelControl: 0x20,
  DataControl: 0x10,
  ArmControl: 0x31,
  MapControl: 0x30,
  Error: 0xff,
} as const;

const CmdB1 = {
  Mode: 0x00,
  Motion: 0x01,
  Speed: 0x02,
  LeftSpeed: 0x10,
  RightSpeed: 0x11,
  LeftDuty: 0x20,
  RightDuty: 0x21,
  Wheel_Left: 0x01,
  Wheel_Right: 0x02,
} as const;

const ArmCmdB1 = {
  Buttom: 0x00,
  Shoulder: 0x01,
  Elbow_Btm: 0x02,
  Elbow_Top: 0x03,
  Wrist: 0x04,
  Finger: 0x05,
  Arm: 0x10,
} as const;

const CmdB2 = {
  Mode: {
    Free: 0x00,
    Track: 0x03,
  },
  Motion: {
    Stop: 0x00,
    Forward: 0x01,
    Backward: 0x02,
    Left: 0x03,
    Right: 0x04,
  },
  Speed: {},
} as const;

const ArmCmdB2 = {
  Stop: 0x00,
  Set: 0x01,
} as const;

const MapCmdB1 = {
  Set: 0x01,
} as const;

const MapCmdB2 = {
  FORWARD: 0x00,
  BACKWARD: 0x01,
  LEFT: 0x02,
  RIGHT: 0x03,
};
// 錯誤類型定義
// const ERROR_CODES = {
//   SENSOR_FAILURE: 0x01,
//   MOTOR_FAILURE: 0x02,
//   COMMUNICATION_ERROR: 0x03,
//   POWER_LOW: 0x04,
//   OVERHEATING: 0x05,
//   UNKNOWN_COMMAND: 0x06,
// } as const;

export { CmdB0, CmdB1, CmdB2, ArmCmdB1, ArmCmdB2, MapCmdB1, MapCmdB2 };
