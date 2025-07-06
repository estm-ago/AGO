import { type FC } from 'react';
import useWebSocket from 'react-use-websocket';
import Controller from '../components/Controller';
import { WEBSOCKET_CONFIG } from '../config/websocket';

const ControlPage: FC = () => {
  const webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">車輛控制面板</h2>
          <p className="text-gray-600">
            使用下方控制面板來操控ESP32車輛的移動方向和速度
          </p>
        </div>
        
        <Controller {...webSocketHook} />
      </div>
    </div>
  );
};

export default ControlPage; 