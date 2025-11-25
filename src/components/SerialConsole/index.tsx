import { useEffect, useRef, useState, type FC } from "react";
import { type CANPortConfig, type SetCANPortConfig, openSerialPort, closeSerialPort } from "./serialPortHelpers";
import { type WSCanFrame } from '@/hooks'
import { CmdB0, CmdB1, type ReceivedData } from "@/types";
import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';
import { sendWSCanFrame } from "./WSCanSendReceive";

interface SerialConsoleProps {
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

function hexStringToBytes(str: string): Uint8Array {
  // 1. 分割（用空白、逗號都可）
  const parts = str.trim().split(/\s+/);

  // 2. 每個字串轉成 0~255
  const bytes = parts.map((p) => {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 255) {
      throw new Error(`非法 hex byte: "${p}"`);
    }
    return v;
  });

  // 3. 回傳 Uint8Array
  return new Uint8Array(bytes);
}

function bytesToHex(bytes: ArrayLike<number>): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i]!.toString(16).padStart(2, "0") + " ";
  }
  return result.trimEnd();
}

const SerialConsole: FC<SerialConsoleProps> = ({ CANPortConfig, setCANPortConfig, dataReceive, dataStatistics }) => {
  if (!("serial" in navigator)) {
    throw new Error("此瀏覽器不支援 Web Serial API");
  }

  const serialPort = CANPortConfig.port;
  const log = CANPortConfig.log;
  const isConnected =
    !!serialPort && serialPort.readable !== null && serialPort.writable !== null;
  const [status, setStatus] = useState<string>("尚未連線");
  const [input, setInput] = useState<string>(
    "10 10 01 90 00 00 00 00"
  );
  useEffect(() => {
    if (isConnected) {
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
      const newConfig: CANPortConfig = {
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
      const datas = hexStringToBytes(input);
      const frame: WSCanFrame = {
        id: 0x123,
        extended: false,
        rtr: false,
        dlc: datas.length,
        data: datas,
      };
      await sendWSCanFrame(frame, CANPortConfig, setCANPortConfig);
    } catch(err: any) {
      setStatus(`送出失敗: ${err?.message ?? String(err)}`);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 800 }}>
      <h2>USB-CAN 串口測試</h2>
      <p>{status}</p>

      <div style={{ marginBottom: "0.5rem" }}>
        {isConnected  ? (
          <button onClick={handleDisconnect}>中斷連線</button>
        ) : (
          <button onClick={handleConnect}>選擇 Port 並連線</button>
        )}
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>
          傳送十六進位資料：
          <br />
          <input
            style={{ width: "100%", fontFamily: "monospace" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleSend} disabled={!isConnected }>
          送出
        </button>
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

export default SerialConsole;
