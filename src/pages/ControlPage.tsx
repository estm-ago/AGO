import { type FC } from 'react';
import Controller from '../components/Controller';
import type { WebAndSerialProps } from '@/types';
import { Car } from 'lucide-react';

const ControlRouteConfig = {
  key: 'control',
  label: '車輛控制',
  icon: Car,
};

const ControlPage: FC<WebAndSerialProps> = (props) => {
  return (
    <div className='min-h-screen own-bg-white own-text-black'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold own-text-gray-900 mb-2'>車輛控制面板</h2>
          <p className='own-text-gray-600'>使用下方控制面板來操控ESP32車輛的移動方向和速度</p>
        </div>

        <Controller {...props} />
      </div>
    </div>
  );
};

export { ControlPage, ControlRouteConfig };
