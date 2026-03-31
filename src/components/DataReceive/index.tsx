import { useEffect, useRef, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { ReadyState } from 'react-use-websocket';
import { ReceivedDataPanel } from './ReceivedDataPanel';
import { DataStatisticsPanel } from './DataStatisticsPanel';
import { DATA_REQUEST_COMMANDS, parseReceivedData, uint8ArrayToHex } from '@/utils';

import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';
import { BatteryIcon } from './battery';

interface DataReceiveProps extends WebSocketHook {
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

const DataReceive: FC<DataReceiveProps> = ({ sendMessage, lastMessage, readyState, dataReceive, dataStatistics }) => {
  const {
    receivedData,
    errorData,
    latestMotorData,
    addReceivedData,
    clearReceivedData,
    clearErrorData,
    getDataSummary,
  } = dataReceive;

  const {
    statistics,
    updateStatistics,
    resetStatistics,
    getOverallPerformance
  } = dataStatistics;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestIndexRef = useRef(0);

  // 自動數據請求的 useEffect
  useEffect(() => {
    // 清除之前的定時器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 只有在連線狀態為 OPEN 時才啟動自動請求
    if (readyState === ReadyState.OPEN) {
      console.log('🔄 啟動自動數據請求 (每秒1次)');

      intervalRef.current = setInterval(() => {
        try {
          // 循環請求不同類型的數據
          const requests = DATA_REQUEST_COMMANDS.allMotorData();
          const currentRequest = requests[requestIndexRef.current % requests.length];

          console.log(
            `📡 發送數據請求 (${(requestIndexRef.current % requests.length) + 1}/4):`,
            uint8ArrayToHex(currentRequest),
          );

          sendMessage(currentRequest.buffer);
          requestIndexRef.current++;
        } catch (error) {
          console.error('發送數據請求時發生錯誤:', error);
        }
      }, 1000); // 每秒執行一次
    } else {
      console.log('⏸️ 連線未建立，暫停自動數據請求');
    }

    // 清理函數
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🛑 停止自動數據請求');
      }
    };
  }, [readyState, sendMessage]);

  // 處理接收到的數據
  useEffect(() => {
    if (!lastMessage) return;

    const data = lastMessage.data;

    // 處理二進制數據 (ArrayBuffer 或 Blob)
    try {
      if (data instanceof ArrayBuffer) {
        const parsedData = parseReceivedData(data);
        if (parsedData) {
          addReceivedData(parsedData);
          updateStatistics(parsedData);
          logReceivedData(data, parsedData);
        }
      } else if (data instanceof Blob) {
        data.arrayBuffer().then((buffer) => {
          const parsedData = parseReceivedData(buffer);
          if (parsedData) {
            addReceivedData(parsedData);
            updateStatistics(parsedData);
            logReceivedData(buffer, parsedData);
          }
        });
      } else if (typeof data === 'string') {
        // 如果收到字符串數據，嘗試解析為16進制
        try {
          const hexString = data.replace(/\s/g, '');
          if (hexString.length % 2 === 0 && /^[0-9A-Fa-f]+$/.test(hexString)) {
            const bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
              bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
            }
            const parsedData = parseReceivedData(bytes.buffer);
            if (parsedData) {
              addReceivedData(parsedData);
              updateStatistics(parsedData);
              logReceivedData(bytes.buffer, parsedData);
            }
          }
        } catch (error) {
          console.warn('無法解析字符串數據:', data, error);
        }
      }
    } catch (error) {
      console.warn('處理接收數據時發生錯誤:', error);
    }
  }, [lastMessage, addReceivedData, updateStatistics]);

  // 將接收到的數據輸出到 console
  const logReceivedData = (buffer: ArrayBuffer, parsedData: any) => {
    const rawBytes = new Uint8Array(buffer);

    // 根據是否為錯誤使用不同的樣式
    const logStyle = parsedData.isError
      ? 'color: #dc2626; font-weight: bold' // 錯誤數據 - 紅色
      : parsedData.cmd0 === 0x00
      ? 'color: #2563eb; font-weight: bold' // 數據回傳 - 藍色
      : 'color: #16a34a; font-weight: bold'; // 車輛控制 - 綠色

    const emoji = parsedData.isError ? '❌' : '📥';

    // 輸出格式化的數據
    console.group(
      `%c${emoji} ${parsedData.isError ? '錯誤' : '接收'}數據 - ${parsedData.description}`,
      logStyle,
    );
    console.log('⏰ 時間:', parsedData.timestamp);
    console.log('📦 原始數據:', uint8ArrayToHex(rawBytes));

    if (parsedData.isError) {
      console.warn('⚠️ 錯誤詳情:', {
        錯誤代碼: parsedData.errorCode,
        錯誤描述: parsedData.parsedValue,
        CMD0: `0x${parsedData.cmd0.toString(16).padStart(2, '0').toUpperCase()}`,
        CMD1: `0x${parsedData.cmd1.toString(16).padStart(2, '0').toUpperCase()}`,
      });
    } else {
      console.table({
        CMD0: `0x${parsedData.cmd0.toString(16).padStart(2, '0').toUpperCase()}`,
        CMD1: `0x${parsedData.cmd1.toString(16).padStart(2, '0').toUpperCase()}`,
        解析值: parsedData.parsedValue,
        原始值: parsedData.rawValue,
      });
    }
    console.groupEnd();
  };

  const dataSummary = getDataSummary();
  const overallPerformance = getOverallPerformance();

  return (
    <div className='max-w-6xl mx-auto p-6'>
      {/* 自動請求狀態指示器 */}
      <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className={`w-3 h-3 rounded-full ${
                readyState === ReadyState.OPEN ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            ></div>
            <span className='text-sm font-medium'>
              自動數據請求: {readyState === ReadyState.OPEN ? '運行中' : '已停止'}
            </span>
          </div>
          <div className='text-xs text-gray-600 space-y-1'>
            <div>頻率: 1秒/次 | 類型: 馬達數據</div>
            <div>
              成功率: {dataSummary.successRate}% ({dataSummary.success}/{dataSummary.total})
            </div>
          </div>
        </div>
      </div>
      
      <BatteryIcon level={50} charging={false} />

      {/* 數據統計面板 */}
      <div className='mb-6'>
        <DataStatisticsPanel
          statistics={statistics}
          overallPerformance={overallPerformance}
          onReset={resetStatistics}
        />
      </div>

      {/* 原有的數據顯示面板 */}
      <ReceivedDataPanel
        receivedData={receivedData}
        latestMotorData={latestMotorData}
        onClearData={clearReceivedData}
      />

      {/* 錯誤數據顯示 */}
      {errorData.length > 0 && (
        <div className='mt-6'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-medium text-red-800'>
                錯誤數據記錄 ({errorData.length})
              </h3>
              <button
                onClick={clearErrorData}
                className='text-sm text-red-600 hover:text-red-700 underline'
              >
                清除錯誤記錄
              </button>
            </div>
            <div className='space-y-2 max-h-40 overflow-y-auto'>
              {errorData.slice(0, 10).map((error) => (
                <div key={error.id} className='text-sm bg-red-100 p-2 rounded'>
                  <span className='text-red-700 font-medium'>{error.timestamp}</span>
                  <span className='mx-2'>-</span>
                  <span className='text-red-600'>{error.parsedValue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataReceive;
