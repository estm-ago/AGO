// import Robotic from '@/components/Robotic';
import type { WebAndSerialProps } from '@/types';
import type { FC } from 'react';
import { Wifi } from 'lucide-react';

const WifiRouteConfig = {
  key: 'wifi',
  label: 'WI-FI',
  icon: Wifi,
};

const WifiPage: FC<WebAndSerialProps> = (props) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Wifi控制面板</h2>
          <p className='text-gray-600'>...</p>
        </div>

        {/* <Robotic {...props} /> */}
      </div>
    </div>
  );
};

export { WifiPage, WifiRouteConfig };
