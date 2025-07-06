import { useState, useCallback } from 'react';
import { type ReceivedData } from '../types/vehicle';

export function useDataReceive() {
  const [receivedData, setReceivedData] = useState<ReceivedData[]>([]);
  const [latestMotorData, setLatestMotorData] = useState({
    leftSpeed: 0,
    rightSpeed: 0,
    leftDuty: 0,
    rightDuty: 0,
  });

  const addReceivedData = useCallback((data: ReceivedData) => {
    setReceivedData(prev => [data, ...prev].slice(0, 50)); // 保留最新50條數據
    
    // 更新最新的馬達數據
    if (data.cmd0 === 0x00) { // CMD_B0_DATA
      switch (data.cmd1) {
        case 0x10: // CMD_B1_LEFT_SPEED
          setLatestMotorData(prev => ({ ...prev, leftSpeed: data.parsedValue as number }));
          break;
        case 0x11: // CMD_B1_RIGHT_SPEED
          setLatestMotorData(prev => ({ ...prev, rightSpeed: data.parsedValue as number }));
          break;
        case 0x20: // CMD_B1_LEFT_DUTY
          setLatestMotorData(prev => ({ ...prev, leftDuty: data.parsedValue as number }));
          break;
        case 0x21: // CMD_B1_RIGHT_DUTY
          setLatestMotorData(prev => ({ ...prev, rightDuty: data.parsedValue as number }));
          break;
      }
    }
  }, []);

  const clearReceivedData = useCallback(() => {
    setReceivedData([]);
  }, []);

  return {
    receivedData,
    latestMotorData,
    addReceivedData,
    clearReceivedData,
  };
} 