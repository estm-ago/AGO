import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { type WSCanFrame, WSCan } from './WSCan';
import { closeSerialPort, openSerialPort, type CANPortConfig, type SetCANPortConfig } from './serialPortHelpers';
import { useDataReceive } from './useDataReceive';
import { useDataStatistics } from './useDataStatistics';
import { useVehicleLogs } from './useVehicleLogs';
import { useVehicleStatus } from './useVehicleStatus';
import { sendWSCanFrame, startReadLoop, type ReadLoopOptions } from './WSCanSendReceive';
import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';

interface WebAndSerialProps extends WebSocketHook
{
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
}

interface SerialConsoleProps
{
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

export { 
  type WebAndSerialProps,
  type CANPortConfig, type SetCANPortConfig, openSerialPort, closeSerialPort,
  type ReadLoopOptions, startReadLoop, sendWSCanFrame,
  type WSCanFrame, WSCan,
  useDataReceive, useDataStatistics, useVehicleLogs, useVehicleStatus,
  type SerialConsoleProps,
};
