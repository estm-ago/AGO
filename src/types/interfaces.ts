import type { CmdB1, CmdB2, CmdB2Type } from '.';

// 接收數據結構
interface ReceivedData {
  id: string;
  timestamp: string;
  cmd0: number;
  cmd1: number;
  rawValue: number;
  parsedValue: number | string;

  rawHex: string;
  isError: boolean;
  errorCode?: number;
}
// 數據統計結構
interface DataStatistics {
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

interface VehicleStatus {
  isMoving: boolean;
  currentDirection: string;
  speed: number;
  connectionStatus: ConnectionStatus;
}

interface ConnectionStatus {
  text: string;
  color: string;
  icon: any;
}

interface LogEntry {
  timestamp: string;
  message: string;
  success: boolean;
}
interface CarCommandOpts {
  mode?: CmdB2Type<'Mode'>;
  motion?: CmdB2Type<'Motion'>;
  speed?: number;
  direction: string;
}
interface MotorCommandOpts {
  motor: Extract<keyof typeof CmdB1, 'Wheel_Left' | 'Wheel_Right'>;
  // mode?: (typeof CmdB2)['Mode']['Free'];
  motion?: Exclude<keyof (typeof CmdB2)['Motion'], 'Left' | 'Right'>;
  speed?: number;
  direction: string;
}

export type {
  ReceivedData,
  DataStatistics,
  VehicleStatus,
  ConnectionStatus,
  LogEntry,
  CarCommandOpts,
  MotorCommandOpts,
};
