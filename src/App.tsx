import useWebSocket from 'react-use-websocket';
import Controller from './components/Controller';
import DataReceive from './components/DataReceive';

function App() {
  const obj = useWebSocket('wss://huanyu.duacodie.com:25443/ws', {});
  
  return (
    <div className='flex min-h-svh flex-col items-center justify-center p-4 space-y-8'>
      <div className='w-full max-w-6xl'>
        <h1 className='text-3xl font-bold text-center mb-8'>ESP32 車輛控制系統</h1>
        
        {/* 車輛控制面板 */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold mb-4'>車輛控制</h2>
          <Controller {...obj} />
        </div>
        
        {/* 數據接收面板 */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>數據接收</h2>
          <DataReceive {...obj} />
        </div>
      </div>
    </div>
  );
}

export default App;
