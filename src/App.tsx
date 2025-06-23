import { Button } from './components/ui/button';
import React, { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export const EchoDemo: React.FC = () => {
  const { sendMessage, lastMessage, readyState } = useWebSocket('wss://huanyu.duacodie.com:25443/ws',{});

  const [logs, setLogs] = useState<string[]>([]);

  // 每次收到訊息就把它記錄下來
  useEffect(() => {
    if (!lastMessage) return;
    if (typeof lastMessage.data === 'string') {
      setLogs((l) => [...l, `文字：${lastMessage.data}`]);
    } else {
      const arr = new Uint8Array(lastMessage.data);
      setLogs((l) => [...l, `二進制：[${arr.join(', ')}]`]);
    }
  }, [lastMessage]);

  return (
    <div>
      <div>連線狀態：{ReadyState[readyState]}</div>
      <Button onClick={() => sendMessage('你好，Echo！')}>傳文字給 Server</Button>
      <Button
        onClick={() => {
          const buf = new Uint8Array([0x10, 0x20, 0x30]);
          sendMessage(buf.buffer);
        }}
      >
        傳二進制給 Server
      </Button>
      <ul>
        {logs.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

function App() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center'>
      <EchoDemo />
      <Button>Click me</Button>
    </div>
  );
}

export default App;
