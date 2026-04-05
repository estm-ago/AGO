import { type FC } from 'react';
import CANConsole from '../components/SerialPort';
import { Cable } from 'lucide-react';
import { type WebCANConsoleProps } from '@/types';

const UsbCANRouteConfig = {
  key: 'serial',
  label: 'Serial',
  icon: Cable,
};

const UsbCANPage: FC<WebCANConsoleProps> = (props) => {
  return (
    <div className='min-h-screen own-bg-white own-text-black'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold own-text-gray-900 mb-2'>Serial控制面板</h2>
          <p className='own-text-gray-600'>...</p>
        </div>

        <CANConsole {...props} />
      </div>
    </div>
  );
};

export { UsbCANPage, UsbCANRouteConfig };
