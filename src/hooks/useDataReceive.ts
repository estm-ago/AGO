import type { ReceivedData } from '@/types';
import { useState, useCallback } from 'react';

export function useDataReceive() {
  const [receivedData, setReceivedData] = useState<ReceivedData[]>([]);
  const [successData, setSuccessData] = useState<ReceivedData[]>([]);
  const [errorData, setErrorData] = useState<ReceivedData[]>([]);
  const [latestMotorData, setLatestMotorData] = useState({
    leftSpeed: 0,
    rightSpeed: 0,
    leftDuty: 0,
    rightDuty: 0,
  });

  const addReceivedData = useCallback((data: ReceivedData) => {
    // 所有數據都添加到總列表中（用於顯示）
    setReceivedData((prev) => [data, ...prev].slice(0, 50));

    if (data.isError) {
      // 錯誤數據單獨存儲
      setErrorData((prev) => [data, ...prev].slice(0, 20));
      console.warn('❌ 錯誤數據已排除:', {
        error: data.parsedValue,
        timestamp: data.timestamp,
      });
    } else {
      // 只有成功的數據才用於統計和更新馬達狀態
      setSuccessData((prev) => [data, ...prev].slice(0, 50));

      // 更新最新的馬達數據（只使用成功數據）
      if (data.cmd0 === 0x00 && typeof data.parsedValue === 'number') {
        switch (data.cmd1) {
          case 0x10: // CMD_B1_LEFT_SPEED
            setLatestMotorData((prev) => ({ ...prev, leftSpeed: data.parsedValue as number }));
            break;
          case 0x11: // CMD_B1_RIGHT_SPEED
            setLatestMotorData((prev) => ({ ...prev, rightSpeed: data.parsedValue as number }));
            break;
          case 0x20: // CMD_B1_LEFT_DUTY
            setLatestMotorData((prev) => ({ ...prev, leftDuty: data.parsedValue as number }));
            break;
          case 0x21: // CMD_B1_RIGHT_DUTY
            setLatestMotorData((prev) => ({ ...prev, rightDuty: data.parsedValue as number }));
            break;
        }
      }

      console.log('✅ 成功數據已處理:', {
        value: data.parsedValue,
        timestamp: data.timestamp,
      });
    }
  }, []);

  const clearReceivedData = useCallback(() => {
    setReceivedData([]);
    setSuccessData([]);
    setErrorData([]);
  }, []);

  const clearErrorData = useCallback(() => {
    setErrorData([]);
  }, []);

  const getDataSummary = useCallback(() => {
    const total = receivedData.length;
    const success = successData.length;
    const errors = errorData.length;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '0';

    return {
      total,
      success,
      errors,
      successRate: parseFloat(successRate),
    };
  }, [receivedData.length, successData.length, errorData.length]);

  return {
    // 所有數據（用於顯示完整日誌）
    receivedData,
    // 只有成功的數據（用於統計）
    successData,
    // 只有錯誤的數據（用於錯誤分析）
    errorData,
    // 最新馬達數據（基於成功數據）
    latestMotorData,
    // 方法
    addReceivedData,
    clearReceivedData,
    clearErrorData,
    getDataSummary,
  };
}
