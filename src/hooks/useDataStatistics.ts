import { CmdB0, CmdB1, type DataStatistics, type ReceivedData } from '@/types';
import { formatTimestamp } from '@/utils';
import { useState, useCallback } from 'react';

// 初始統計數據
const initialStatistics: DataStatistics = {
  totalReceived: 0,
  successCount: 0,
  errorCount: 0,
  successRate: 0,

  leftSpeed: {
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    samples: 0,
  },

  rightSpeed: {
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    samples: 0,
  },

  leftDuty: {
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    samples: 0,
  },

  rightDuty: {
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    samples: 0,
  },

  lastUpdated: formatTimestamp(),
};

// 更新單個數據類型的統計
function updateStatisticField(
  current: DataStatistics[keyof Omit<
    DataStatistics,
    'totalReceived' | 'successCount' | 'errorCount' | 'successRate' | 'lastUpdated'
  >],
  newValue: number,
) {
  const samples = current.samples + 1;
  const total = current.average * current.samples + newValue;
  const average = total / samples;

  return {
    current: newValue,
    average: parseFloat(average.toFixed(2)),
    min: samples === 1 ? newValue : Math.min(current.min, newValue),
    max: samples === 1 ? newValue : Math.max(current.max, newValue),
    samples,
  };
}

export function useDataStatistics() {
  const [statistics, setStatistics] = useState<DataStatistics>(initialStatistics);

  const updateStatistics = useCallback((data: ReceivedData) => {
    setStatistics((prev) => {
      const newStats = { ...prev };

      // 更新總計數器
      newStats.totalReceived += 1;

      if (data.isError) {
        newStats.errorCount += 1;
      } else {
        newStats.successCount += 1;

        // 只處理成功的數據回傳
        if (data.cmd0 === CmdB0.DataControl && typeof data.parsedValue === 'number') {
          switch (data.cmd1) {
            case CmdB1.LeftSpeed:
              newStats.leftSpeed = updateStatisticField(newStats.leftSpeed, data.parsedValue);
              break;
            case CmdB1.RightSpeed:
              newStats.rightSpeed = updateStatisticField(newStats.rightSpeed, data.parsedValue);
              break;
            case CmdB1.LeftDuty:
              newStats.leftDuty = updateStatisticField(newStats.leftDuty, data.parsedValue);
              break;
            case CmdB1.RightDuty:
              newStats.rightDuty = updateStatisticField(newStats.rightDuty, data.parsedValue);
              break;
          }
        }
      }

      // 更新成功率
      newStats.successRate =
        newStats.totalReceived > 0
          ? parseFloat(((newStats.successCount / newStats.totalReceived) * 100).toFixed(1))
          : 0;

      newStats.lastUpdated = formatTimestamp();

      return newStats;
    });
  }, []);

  const resetStatistics = useCallback(() => {
    setStatistics(initialStatistics);
  }, []);

  const getOverallPerformance = useCallback(() => {
    const { leftSpeed, rightSpeed, leftDuty, rightDuty } = statistics;

    // 計算整體效能指標
    const avgSpeed = (leftSpeed.average + rightSpeed.average) / 2;
    const avgDuty = (leftDuty.average + rightDuty.average) / 2;
    const speedBalance = Math.abs(leftSpeed.average - rightSpeed.average);
    const dutyBalance = Math.abs(leftDuty.average - rightDuty.average);

    return {
      averageSpeed: parseFloat(avgSpeed.toFixed(2)),
      averageDuty: parseFloat(avgDuty.toFixed(2)),
      speedBalance: parseFloat(speedBalance.toFixed(2)),
      dutyBalance: parseFloat(dutyBalance.toFixed(2)),
      isBalanced: speedBalance < 10 && dutyBalance < 5, // 平衡閾值
    };
  }, [statistics]);

  return {
    statistics,
    updateStatistics,
    resetStatistics,
    getOverallPerformance,
  };
}
