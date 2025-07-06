// import { Button } from './components/ui/button';
// import useWebSocket from 'react-use-websocket';

// import Controller from './components/Controller';
// function App() {
//   const obj = useWebSocket('wss://huanyu.duacodie.com:25443/ws', {});
//   return (
//     <div className='flex min-h-svh flex-col items-center justify-center'>
//       {/* <EchoDemo {...obj} /> */}
//       <Button className='my-1.5'>Click me</Button>
//       <Controller {...obj} />
//     </div>
//   );
// }

// export default App;
import useWebSocket from 'react-use-websocket';
import Controller from './components/Controller';

function App() {
  const websocketHook = useWebSocket('wss://huanyu.duacodie.com:25443/ws', {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
  });

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <Controller {...websocketHook} />
      </div>
    </div>
  );
}

export default App;
