import { WSCan } from "./useWebWSCan";
import { ReadyState } from 'react-use-websocket';
import { type WebCANPortConfig, type SetWebCANPortConfig } from '@/types';

export async function openSerialPort (
  options: WebCANPortConfig,
  setCANPortConfig: SetWebCANPortConfig,
): Promise<SerialPort> {
  if (!("serial" in navigator)) {
    throw new Error("此瀏覽器不支援 Web Serial API");
  }
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: options.baudRate });
  console.log("port opened");

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  if (options.readLoopOptions) {
    reader = await WSCan.startReadLoop(port, options.readLoopOptions);
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
  options: WebCANPortConfig,
  setCANPortConfig: SetWebCANPortConfig,
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
