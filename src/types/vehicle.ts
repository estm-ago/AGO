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
