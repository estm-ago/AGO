import { useEffect, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { parseReceivedData, uint8ArrayToHex } from '../utils/vehicle';
import { useDataReceive } from '../hooks/useDataReceive';
import { ReceivedDataPanel } from './ReceivedDataPanel';

const DataReceive: FC<WebSocketHook> = ({ lastMessage }) => {
  const { receivedData, latestMotorData, addReceivedData, clearReceivedData } = useDataReceive();

  useEffect(() => {
    if (!lastMessage) return;
    
    const data = lastMessage.data;
    
    // 處理二進制數據 (ArrayBuffer 或 Blob)
    if (data instanceof ArrayBuffer) {
      const parsedData = parseReceivedData(data);
      if (parsedData) {
        addReceivedData(parsedData);
        logReceivedData(data, parsedData);
      }
    } else if (data instanceof Blob) {
      data.arrayBuffer().then((buffer) => {
        const parsedData = parseReceivedData(buffer);
        if (parsedData) {
          addReceivedData(parsedData);
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
            bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
          }
          const parsedData = parseReceivedData(bytes.buffer);
          if (parsedData) {
            addReceivedData(parsedData);
            logReceivedData(bytes.buffer, parsedData);
          }
        }
      } catch (error) {
        console.warn('無法解析字符串數據:', data, error);
      }
    }
  }, [lastMessage, addReceivedData]);

  // 將接收到的數據輸出到 console
  const logReceivedData = (buffer: ArrayBuffer, parsedData: any) => {
    const rawBytes = new Uint8Array(buffer);
    
    // 使用不同的顏色來區分不同類型的數據
    const logStyle = parsedData.cmd0 === 0x00 ? 
      'color: #2563eb; font-weight: bold' : // 數據回傳
      'color: #16a34a; font-weight: bold';  // 車輛控制
    
    // 輸出格式化的數據
    console.group(`%c接收數據 - ${parsedData.description}`, logStyle);
    console.log('時間:', parsedData.timestamp);
    console.log('原始數據:', uint8ArrayToHex(rawBytes));
    console.table({
      'CMD0': `0x${parsedData.cmd0.toString(16).padStart(2, '0').toUpperCase()}`,
      'CMD1': `0x${parsedData.cmd1.toString(16).padStart(2, '0').toUpperCase()}`,
      '解析值': parsedData.parsedValue,
      '原始值': parsedData.rawValue,
    });
    console.groupEnd();
  };

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <ReceivedDataPanel
        receivedData={receivedData}
        latestMotorData={latestMotorData}
        onClearData={clearReceivedData}
      />
    </div>
  );
};

export default DataReceive;