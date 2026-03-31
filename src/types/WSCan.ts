import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import type { Dispatch, SetStateAction } from 'react';
import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';
import { ReadyState } from 'react-use-websocket';

interface WSCanFrame {
  /** 是否為 29-bit 擴展 ID（true = extended, false = standard 11-bit） */
  extended: boolean;

  /** Remote Transmission Request（true = RTR frame） */
  rtr: boolean;

  /** CAN ID（0x000 ~ 0x7FF or 0x1FFFFFFF） */
  id: number;

  /** 資料內容，實際長度應該等於 dlc（0~8 bytes） */
  data: Uint8Array;

  /** Data Length Code，0 ~ 8 */
  dlc: number;

  /** 是否為錯誤 frame（如 bus error） */
  error?: boolean;
}

interface ReadLoopOptions {
  frameSize: number; // 像你現在的 FRAME_SIZE = 20
  onFrame: (frame: WSCanFrame) => void;        // 收到一整包 frame 時要做什麼
  onError?: (err: unknown) => void;            // 讀取失敗
  onDone?: () => void;                         // reader 結束
}

interface CANPortConfig {
  readyState: ReadyState,
  port: SerialPort | null,
  baudRate: number;
  log: string;
  readLoopOptions: ReadLoopOptions | null;
  reader: ReadableStreamDefaultReader | null;
}

type SetCANPortConfig = Dispatch<SetStateAction<CANPortConfig>>;

interface WebAndSerialProps extends WebSocketHook
{
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
}

interface CANConsoleProps
{
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

export type {
  WSCanFrame,
  ReadLoopOptions,
  CANPortConfig,
  SetCANPortConfig,
  WebAndSerialProps,
  CANConsoleProps,
};
