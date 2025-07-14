const CmdB0 = {
  VehicleControl: 0x21,
  WheelControl: 0x20,
  DataControl: 0x10,
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

// 錯誤類型定義
// const ERROR_CODES = {
//   SENSOR_FAILURE: 0x01,
//   MOTOR_FAILURE: 0x02,
//   COMMUNICATION_ERROR: 0x03,
//   POWER_LOW: 0x04,
//   OVERHEATING: 0x05,
//   UNKNOWN_COMMAND: 0x06,
// } as const;

export { CmdB0, CmdB1, CmdB2 };
