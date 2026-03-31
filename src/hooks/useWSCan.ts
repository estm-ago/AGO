import {
  type WSCanFrame, type CANPortConfig, type SetCANPortConfig, type ReadLoopOptions,
  WSCan_Baudrate
} from "@/types";

const WSCan_Size = 20;

export const WSCan = {
  Size: WSCan_Size,
  Baudrate: WSCan_Baudrate,

  dataEncode(frame: WSCanFrame): Uint8Array 
  {
    const packet = new Uint8Array(WSCan_Size);
    packet[0] = 0xAA;
    packet[1] = 0x55;
    packet[2] = 0x01;
    packet[3] = frame.extended ? 0x02 : 0x01;
    packet[4] = frame.rtr ? 0x02 : 0x01;
    const id = frame.id >>> 0; // 確保是無號
    packet[5] = id & 0xff;
    packet[6] = (id >>> 8) & 0xff;
    packet[7] = (id >>> 16) & 0xff;
    packet[8] = (id >>> 24) & 0xff;
    const dlc = Math.min(Math.max(frame.dlc, 0), 8);
    packet[9] = dlc;
    for (let i = 0; i < 8; i++)
    {
      packet[10 + i] = i < frame.data.length ? frame.data[i]! : 0x00;
    }
    packet[18] = 0x00;
    let sum = 0;
    for (let i = 2; i <= 18; i++)
    {
      sum += packet[i]!;
    }
    packet[19] = sum & 0xff;
    return packet;
  },

  dataDecode(packet: Uint8Array): WSCanFrame
  {
    if (packet.length !== WSCan_Size)
    {
      throw new Error(`CAN fixed20 長度錯誤,預期 20, 實際 ${packet.length}`);
    }
    if (packet[0] !== 0xaa || packet[1] !== 0x55)
    {
      throw new Error("CAN fixed20 header 錯誤");
    }
    const type = packet[2];
    if (type !== 0x01)
    {
      // 你也可以選擇直接回傳 error，而不是 throw
      throw new Error(`未知 type: 0x${type.toString(16)}`);
    }
    // 校驗碼檢查
    let sum = 0;
    for (let i = 2; i <= 18; i++)
    {
      sum += packet[i]!;
    }
    const checksum = sum & 0xff;
    if (checksum !== packet[19])
    {
      throw new Error(
      `checksum 錯誤，預期 0x${checksum.toString(16)}，實際 0x${packet[19]
        .toString(16)
        .padStart(2, "0")}`,
      );
    }

    // frame type / format
    const frameType = packet[3];
    const frameFormat = packet[4];

    const extended = frameType === 0x02;
    const rtr = frameFormat === 0x02;

    // ID: little-endian
    const id =
      (packet[5]! |
      (packet[6]! << 8) |
      (packet[7]! << 16) |
      (packet[8]! << 24)) >>> 0;

    // DLC
    const dlcRaw = packet[9]!;
    const dlc = Math.min(Math.max(dlcRaw, 0), 8);

    // data
    const data = new Uint8Array(dlc);
    for (let i = 0; i < dlc; i++)
    {
      data[i] = packet[10 + i]!;
    }

    const frame: WSCanFrame = {
      id,
      extended,
      rtr,
      dlc,
      data,
    };
    return frame;
  },

  async sendWSCanFrame (
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
  },

  async startReadLoop (
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
}
