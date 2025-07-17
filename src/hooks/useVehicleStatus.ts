import { useState, useCallback } from 'react';
import { ReadyState } from 'react-use-websocket';
import { Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '@/types';

export function useVehicleStatus() {
  const [speed, setSpeed] = useState(40);
  const [isMoving, setIsMoving] = useState(false);
  const [currentDirection, setCurrentDirection] = useState('停止');

  const updateSpeed = useCallback((newSpeed: number) => {
    setSpeed(Math.max(0, Math.min(100, newSpeed)));
  }, []);

  const updateMovementStatus = useCallback((moving: boolean, direction: string) => {
    setIsMoving(moving);
    setCurrentDirection(direction);
  }, []);

  const getConnectionStatus = useCallback((readyState: ReadyState): ConnectionStatus => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        return { text: '連線中', color: 'bg-yellow-500', icon: Wifi };
      case ReadyState.OPEN:
        return { text: '已連線', color: 'bg-green-500', icon: Wifi };
      case ReadyState.CLOSING:
        return { text: '斷線中', color: 'bg-orange-500', icon: WifiOff };
      case ReadyState.CLOSED:
        return { text: '已斷線', color: 'bg-red-500', icon: WifiOff };
      default:
        return { text: '未知狀態', color: 'bg-gray-500', icon: WifiOff };
    }
  }, []);

  return {
    speed,
    isMoving,
    currentDirection,
    updateSpeed,
    updateMovementStatus,
    getConnectionStatus,
  };
}
