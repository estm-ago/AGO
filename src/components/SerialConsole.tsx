import React, { useEffect, useRef, useState } from "react";

function bytesToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function parseHexInput(input: string): Uint8Array {
  const parts = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const bytes: number[] = [];
  for (const p of parts) {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 0xff) {
      throw new Error(`無效的十六進位數字: "${p}"`);
    }
    bytes.push(v);
  }
  return new Uint8Array(bytes);
}

const SerialConsole: React.FC = () => {
  const [supported] = useState<boolean>("serial" in navigator);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>("尚未連線");
  const [input, setInput] = useState<string>(
    "AA 55 01 01 01 23 01 00 00 08 11 22 33 44 55 66 77 88 00 93"
  );
  const [log, setLog] = useState<string>("");

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null
  );
  const readLoopAbort = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      // 離開頁面時關閉
      (async () => {
        readLoopAbort.current = true;
        try {
          readerRef.current && (await readerRef.current.cancel());
        } catch {}
        if (portRef.current) {
          try {
            await portRef.current.close();
          } catch {}
        }
      })();
    };
  }, []);

  const startReadLoop = async (port: SerialPort) => {
    if (!port.readable) return;
    const reader = port.readable.getReader();
    readerRef.current = reader;
    readLoopAbort.current = false;

    try {
      while (!readLoopAbort.current) {
        const { value, done } = await reader.read();
        if (done || !value) break;
        setLog((prev) => prev + `RX: ${bytesToHex(value)}\n`);
      }
    } catch (err: any) {
      setStatus(`讀取錯誤: ${err?.message ?? String(err)}`);
    } finally {
      reader.releaseLock();
      readerRef.current = null;
    }
  };

  const handleConnect = async () => {
    if (!supported) return;
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 2_000_000 }); // USB-CAN 預設
      portRef.current = port;
      setConnected(true);
      setStatus("已連線 (2000000 bps)");
      setLog((prev) => prev + "已連線\n");
      await startReadLoop(port);
    } catch (err: any) {
      setStatus(`連線失敗: ${err?.message ?? String(err)}`);
    }
  };

  const handleDisconnect = async () => {
    readLoopAbort.current = true;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
    } catch {}
    try {
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch {}
    portRef.current = null;
    setConnected(false);
    setStatus("已中斷連線");
    setLog((prev) => prev + "已中斷連線\n");
  };

  const handleSend = async () => {
    if (!portRef.current || !portRef.current.writable) {
      setStatus("尚未連線串口");
      return;
    }
    try {
      const data = parseHexInput(input);
      const writer = portRef.current.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      setLog((prev) => prev + `TX: ${bytesToHex(data)}\n`);
    } catch (err: any) {
      setStatus(`送出失敗: ${err?.message ?? String(err)}`);
    }
  };

  if (!supported) {
    return <div>此瀏覽器不支援 Web Serial API（請用 Chrome / Edge）。</div>;
  }

  return (
    <div style={{ padding: "1rem", maxWidth: 800 }}>
      <h2>USB-CAN 串口測試</h2>
      <p>{status}</p>

      <div style={{ marginBottom: "0.5rem" }}>
        {connected ? (
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
            placeholder="例如：AA 55 01 01 01 23 01 00 00 08 ..."
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleSend} disabled={!connected}>
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
