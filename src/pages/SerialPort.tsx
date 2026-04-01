import { type FC } from 'react';
import CANConsole from '../components/SerialPort';
import { Cable } from 'lucide-react';
import { type CANConsoleProps } from '@/types';

const UsbCANRouteConfig = {
  key: 'serial',
  label: 'Serial',
  icon: Cable,
};

const UsbCANPage: FC<CANConsoleProps> = (props) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Serial控制面板</h2>
          <p className='text-gray-600'>...</p>
        </div>

        <CANConsole {...props} />
      </div>
    </div>
  );
};

export { UsbCANPage, UsbCANRouteConfig };
