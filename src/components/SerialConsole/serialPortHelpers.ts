import type { Dispatch, SetStateAction } from 'react';
import { startReadLoop, type ReadLoopOptions } from "./Loop";
import { ReadyState } from 'react-use-websocket';

export interface CANPortConfig {
  readyState: ReadyState,
  port: SerialPort | null,
  baudRate: number;
  log: string;
  readLoopOptions: ReadLoopOptions | null;
  reader: ReadableStreamDefaultReader | null;
}
export type SetCANPortConfig = Dispatch<SetStateAction<CANPortConfig>>;

export async function openSerialPort (
  options: CANPortConfig,
  setCANPortConfig: SetCANPortConfig,
): Promise<SerialPort> {
  if (!("serial" in navigator)) {
    throw new Error("此瀏覽器不支援 Web Serial API");
  }
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: options.baudRate });
  console.log("port opened");

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  if (options.readLoopOptions) {
    reader = await startReadLoop(port, options.readLoopOptions);
    console.log("readLoop started");
  }

  setCANPortConfig(prev => ({
    ...prev,
    readyState: ReadyState.OPEN,
    port,
    reader,
  }));

  return port;
}

export async function closeSerialPort (
  options: CANPortConfig,
  setCANPortConfig: SetCANPortConfig,
): Promise<void> {
  try {
    if (options.reader) {
      await options.reader.cancel();
    }
  } catch {}

  try {
    if (options.port) {
      await options.port.close();
    }
  } catch {}

  setCANPortConfig(prev => ({
    ...prev,
    readyState: ReadyState.CLOSED,
    port: null,
    reader: null,
  }));
}
