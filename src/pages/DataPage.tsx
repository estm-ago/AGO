import { type FC } from 'react';
import useWebSocket from 'react-use-websocket';
import DataReceive from '../components/DataReceive';
import { WEBSOCKET_CONFIG } from '../config/websocket';

const DataPage: FC = () => {
  const webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">數據接收監控</h2>
          <p className="text-gray-600">
            即時監控從ESP32車輛接收的馬達數據和系統狀態
          </p>
        </div>
        
        <DataReceive {...webSocketHook} />
      </div>
    </div>
  );
};

export default DataPage; 