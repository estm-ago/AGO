// 數據接收協議定義
export const CMD_B0_DATA = 0x00;
export const CMD_B0_VEHICLE_CONTROL = 0x10;
export const CMD_B0_ERROR = 0xFF; // 錯誤回傳標識

export const CMD_B1_LEFT_SPEED = 0x10;
export const CMD_B1_RIGHT_SPEED = 0x11;
export const CMD_B1_LEFT_DUTY = 0x20;
export const CMD_B1_RIGHT_DUTY = 0x21;

export const CMD_B1_VEHICLE_STOP = 0x00;
export const CMD_B1_VEHICLE_MOVE = 0x01;
export const CMD_B1_LEFT_STOP = 0x40;
export const CMD_B1_LEFT_SPIN = 0x41;
export const CMD_B1_RIGHT_STOP = 0x42;
export const CMD_B1_RIGHT_SPIN = 0x43;

export const CMD_B2_FORWARD = 0x00;
export const CMD_B2_BACKWARD = 0x01;

export const CmdB0 = {
  VehicleControl: 0x10,
} as const;

export type CmdB0 = (typeof CmdB0)[keyof typeof CmdB0];

export const CmdB1 = {
  VehicleMove: 0x00,
  Left: 0x40,
  Right: 0x50,
} as const;

export type CmdB1 = (typeof CmdB1)[keyof typeof CmdB1];

export const CmdB2 = {
  Stop: 0x00,
  Forward: 0x01,
  Backward: 0x02,
  LeftTurn: 0x03,
  RightTurn: 0x04,
} as const;

export type CmdB2 = (typeof CmdB2)[keyof typeof CmdB2];

// 錯誤類型定義
export const ERROR_CODES = {
  SENSOR_FAILURE: 0x01,
  MOTOR_FAILURE: 0x02,
  COMMUNICATION_ERROR: 0x03,
  POWER_LOW: 0x04,
  OVERHEATING: 0x05,
  UNKNOWN_COMMAND: 0x06,
} as const;

// 接收數據結構
export interface ReceivedData {
  id: string;
  timestamp: string;
  cmd0: number;
  cmd1: number;
  rawValue: number;
  parsedValue: number | string;
  description: string;
  rawHex: string;
  isError: boolean;
  errorCode?: number;
}

// 數據統計結構
export interface DataStatistics {
  totalReceived: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  
  leftSpeed: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  
  rightSpeed: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  
  leftDuty: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  
  rightDuty: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  
  lastUpdated: string;
}

export interface VehicleStatus {
  isMoving: boolean;
  currentDirection: string;
  speed: number;
  connectionStatus: ConnectionStatus;
}

export interface ConnectionStatus {
  text: string;
  color: string;
  icon: any;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  success: boolean;
}
