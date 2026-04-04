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
    <div className='min-h-screen user-bg-theme-white user-text-theme-black'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold user-text-theme-gray-900 mb-2'>Serial控制面板</h2>
          <p className='user-text-theme-gray-600'>...</p>
        </div>

        <CANConsole {...props} />
      </div>
    </div>
  );
};

export { UsbCANPage, UsbCANRouteConfig };
