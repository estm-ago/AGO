import { type FC } from 'react';
import DataReceive from '../components/DataReceive';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';

import type { DataReceiveStore, DataStatisticsStore } from '@/types/DataStatsStore';
interface DataPageProps extends WebSocketHook {
  dataReceive: DataReceiveStore;
  dataStatistics: DataStatisticsStore;
}

const DataPage: FC<DataPageProps> = (data_ws) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>數據接收監控</h2>
          <p className='text-gray-600'>即時監控從ESP32車輛接收的馬達數據和系統狀態</p>
        </div>

        <DataReceive {...data_ws} />
      </div>
    </div>
  );
};

export default DataPage;
