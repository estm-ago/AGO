import Robotic from '@/components/Robotic';
import type { FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';

const RoboticPage: FC<WebSocketHook> = (robot_ws) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>手臂控制面板</h2>
          <p className='text-gray-600'>使用下方控制面板來操控機器手臂的方向和速度</p>
        </div>

        <Robotic {...robot_ws} />
      </div>
    </div>
  );
};

export default RoboticPage;
