import { type FC } from 'react';
import UsbCAN from '../components/SerialConsole';
import { Cat } from 'lucide-react';
import { type SerialConsoleProps } from '@/hooks';

const UsbCANRouteConfig = {
  key: 'usbcan',
  label: 'USB-CAN',
  icon: Cat,
};

const UsbCANPage: FC<SerialConsoleProps> = (controller_ws) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>CAN控制面板</h2>
          <p className='text-gray-600'>...</p>
        </div>

        <UsbCAN {...controller_ws} />
      </div>
    </div>
  );
};

export { UsbCANPage, UsbCANRouteConfig };
