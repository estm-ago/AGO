import { type FC } from 'react';
import DataP from '../components/DataP';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';
import { Database } from 'lucide-react';

const DataRouteConfig = {
  key: 'data',
  label: '數據接收',
  icon: Database,
};

interface DataPageProps extends WebSocketHook {
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

const DataPage: FC<DataPageProps> = (props) => {
  return (
    <div className='min-h-screen own-bg-white own-text-black'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold own-text-gray-900 mb-2'>數據接收監控</h2>
          <p className='own-text-gray-600'>即時監控從ESP32車輛接收的馬達數據和系統狀態</p>
        </div>

        <DataP {...props} />
      </div>
    </div>
  );
};

export { DataPage, DataRouteConfig };
