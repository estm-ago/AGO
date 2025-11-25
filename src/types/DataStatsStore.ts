import { useDataReceive, useDataStatistics } from '@/hooks';

export type DataReceiveStore = ReturnType<typeof useDataReceive>;
export type DataStatisticsStore = ReturnType<typeof useDataStatistics>;
