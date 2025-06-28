import { Button } from './components/ui/button';
import useWebSocket from 'react-use-websocket';

import Controller from './components/Controller';
// export const EchoDemo: React.FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
//   const [logs, setLogs] = useState<string[]>([]);
//   useEffect(() => {
//     if (!lastMessage) return;
//     if (typeof lastMessage.data === 'string') {
//       setLogs((l) => [...l, `文字：${lastMessage.data}`]);
//     } else {
//       const arr = new Uint8Array(lastMessage.data);
//       setLogs((l) => [...l, `二進制：[${arr.join(', ')}]`]);
//     }
//   }, [lastMessage]);

//   return (
//     <div>
//       <div>連線狀態：{ReadyState[readyState]}</div>
//       <Button onClick={() => sendMessage('你好，Echo！')}>傳文字給 Server</Button>
//       <Button
//         onClick={() => {
//           const buf = new Uint8Array([0x10, 0x20, 0x30]);
//           sendMessage(buf.buffer);
//         }}
//       >
//         傳二進制給 Server
//       </Button>
//       <ul>
//         {logs.map((msg, i) => (
//           <li key={i}>{msg}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

function App() {
  const obj = useWebSocket('wss://huanyu.duacodie.com:25443/ws', {});
  return (
    <div className='flex min-h-svh flex-col items-center justify-center'>
      {/* <EchoDemo {...obj} /> */}
      <Button className='my-1.5'>Click me</Button>
      <Controller {...obj} />
    </div>
  );
}

export default App;
