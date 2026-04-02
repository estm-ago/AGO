import { useEffect, useRef, useState, type FC } from "react";
import { WSCan, openSerialPort, closeSerialPort} from '@/hooks'
import {
  type ReceivedData, type WebCANConsoleProps, type WSCanFrame, type WebCANPortConfig,
} from '@/types';

function hexStringToBytes(str: string): Uint8Array
{
  const parts = str.trim().split(/\s+/);

  const bytes = parts.map((p) => {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 255) {
      throw new Error(`非法 hex byte: "${p}"`);
    }
    return v;
  });

  return new Uint8Array(bytes);
}

function hexToUint16(hexStr: string): number
{
  const value = parseInt(hexStr.trim(), 16);

  if (isNaN(value) || value < 0 || value > 65535) {
    throw new Error(`非法的 16 位元十六進位數值: "${hexStr}"`);
  }

  return value;
}

function bytesToHex(bytes: ArrayLike<number>): string
{
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i]!.toString(16).padStart(2, "0") + " ";
  }
  return result.trimEnd();
}

const WebCANConsole: FC<WebCANConsoleProps> = ({ CANPortConfig, setCANPortConfig, dataReceive, dataStatistics }) =>
{
  if (!("serial" in navigator)) {
    throw new Error("此瀏覽器不支援 Web Serial API");
  }

  const serialPort = CANPortConfig.port;
  const log = CANPortConfig.log;
  const isConnected =
    !!serialPort && serialPort.readable !== null && serialPort.writable !== null;
  const [status, setStatus] = useState<string>("尚未連線");
  const [input_adr, setInputAdr] = useState<string>("140");
  const [input_msg, setInputMsg] = useState<string>(
    "02 00 41 F0 00 00" // 02 00 42 8C 00 00
  );
  useEffect(() => {
    if (isConnected)
    {
      setStatus(`已連線 (${CANPortConfig.baudRate} bps)`);
    }
    console.log("serialPort changed:", CANPortConfig);
    console.log("isConnected:", isConnected);
  }, [CANPortConfig.port]);

  const FRAME_SIZE = 20;

  const { addReceivedData } = dataReceive;
  const { updateStatistics } = dataStatistics;

  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const handleConnect = async () => {
    try {
      const newConfig: WebCANPortConfig = {
        ...CANPortConfig,
        readLoopOptions: {
          frameSize: FRAME_SIZE,
          onFrame: (frame) => {
            setCANPortConfig(prev => ({
              ...prev,
              log: prev.log + `RX: ${JSON.stringify(frame)}\n`,
            }));
            console.log("RXC");
            const view = new DataView(frame.data.buffer, frame.data.byteOffset, frame.dlc);

            const data: ReceivedData = {
              isError: false,
              cmd0: view.getUint8(0),
              cmd1: view.getUint8(1),
              parsedValue: view.getUint16(2),
            } as ReceivedData;
            addReceivedData(data);
            updateStatistics(data);

          },
          onError: (err) => {
            setStatus(`讀取錯誤: ${(err as any)?.message ?? String(err)}`);
          },
          onDone: () => {
            console.log("serialPort readLoop stop");
          },
        }
      };
      await openSerialPort(newConfig, setCANPortConfig);
      setStatus(`已連線 (${newConfig.baudRate} bps)`);
      setCANPortConfig(prev => ({
        ...prev,
        log: prev.log + "已連線\n",
      }));
    } catch (err: any) {
      setStatus(`連線失敗: ${err?.message ?? String(err)}`);
    }
  };

  const handleDisconnect = async () => {
    await closeSerialPort(CANPortConfig, setCANPortConfig);
    readerRef.current = null;
    setStatus("已中斷連線");
    setCANPortConfig(prev => ({
      ...prev,
      log: prev.log + "已中斷連線\n",
    }));
  };

  const handleSend = async () => {
    try {
      const adr = hexToUint16(input_adr);
      const datas = hexStringToBytes(input_msg);
      const frame: WSCanFrame = {
        id: adr,
        extended: false,
        rtr: false,
        dlc: datas.length,
        data: datas,
      };
      await WSCan.sendWSCanFrame(frame, CANPortConfig, setCANPortConfig);
    } catch(err: any) {
      setStatus(`送出失敗: ${err?.message ?? String(err)}`);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 800 }}>
      <h2>Web USB-CAN 串口測試</h2>
      <p>{status}</p>
      <div style={{ marginBottom: "0.5rem" }}>
        {isConnected  ? (
          <button
            className="border-2 border-red-500 text-red-500 rounded px-1 hover:bg-red-50 transition-colors"
            onClick={handleDisconnect}
          > 中斷連線 </button>
        ) : (
          <button
            className="border-2 border-green-500 text-green-500 rounded px-1 hover:bg-green-50 transition-colors"
            onClick={handleConnect}
          > 選擇 Port 並連線 </button>
        )}
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>
          傳送至：
          <input
            style={{ width: "100%", fontFamily: "monospace" }}
            value={input_adr}
            onChange={(e) => setInputAdr(e.target.value)}
          />
        </label>
        <label>
          傳送資料：
          <input
            style={{ width: "100%", fontFamily: "monospace" }}
            value={input_msg}
            onChange={(e) => setInputMsg(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
            className="border-2 border-green-500 text-green-500 rounded px-1 hover:bg-green-50 transition-colors"
            onClick={handleSend} disabled={!isConnected }
        > 送出 </button>
      </div>

      <div>
        <label>收發紀錄：</label>
        <textarea
          readOnly
          style={{ width: "100%", height: 200, fontFamily: "monospace" }}
          value={log}
        />
      </div>
    </div>
  );
};

export default WebCANConsole;
