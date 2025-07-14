// 接收數據結構
interface ReceivedData {
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

export type { ReceivedData, DataStatistics, VehicleStatus, ConnectionStatus, LogEntry };
