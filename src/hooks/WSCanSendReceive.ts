import { WSCan, type WSCanFrame } from '@/hooks'
import type { CANPortConfig, SetCANPortConfig } from './serialPortHelpers';

export interface ReadLoopOptions {
  frameSize: number; // 像你現在的 FRAME_SIZE = 20
  onFrame: (frame: WSCanFrame) => void;        // 收到一整包 frame 時要做什麼
  onError?: (err: unknown) => void;            // 讀取失敗
  onDone?: () => void;                         // reader 結束
}

export async function startReadLoop (
  port: SerialPort,
  options: ReadLoopOptions,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const { frameSize, onFrame, onError, onDone } = options;

  if (!port.readable) {
    throw new Error("SerialPort 不可讀");
  }

  const reader = port.readable.getReader();
  let pending = new Uint8Array(0);

  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        // 把新資料接在 pending 後面
        const merged = new Uint8Array(pending.length + value.length);
        merged.set(pending, 0);
        merged.set(value, pending.length);
        pending = merged;

        // 夠大就切成一包一包 frame
        while (pending.length >= frameSize) {
          const datas = pending.slice(0, frameSize);
          pending = pending.slice(frameSize);
          onFrame(WSCan.dataDecode(datas));
        }
      }
    } catch (err) {
      onError?.(err);
    } finally {
      try {
        reader.releaseLock();
      } catch {}
      onDone?.();
    }
  })();

  return reader;
}

export async function sendWSCanFrame (
  frame: WSCanFrame,
  options: CANPortConfig,
  setCANPortConfig: SetCANPortConfig,
) {
  const serialPort = options.port;
  if (!serialPort || !serialPort.writable) return;
  const data = WSCan.dataEncode(frame);
  const writer = serialPort.writable.getWriter();
  await writer.write(data);
  writer.releaseLock();
  setCANPortConfig(prev => ({
    ...prev,
    log: prev.log + `TX: ${JSON.stringify(frame)}\n`,
  }));
}
