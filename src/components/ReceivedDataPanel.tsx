import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Database, Trash2, Activity } from 'lucide-react';
import type { ReceivedData } from '@/types';


interface ReceivedDataPanelProps {
  receivedData: ReceivedData[];
  latestMotorData: {
    leftSpeed: number;
    rightSpeed: number;
    leftDuty: number;
    rightDuty: number;
  };
  onClearData: () => void;
}

export const ReceivedDataPanel: FC<ReceivedDataPanelProps> = ({
  receivedData,
  latestMotorData,
  onClearData,
}) => {
  return (
    <div className='space-y-6'>
      {/* 即時馬達數據顯示 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            即時馬達數據
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600'>左馬達速度</div>
              <div className='text-lg font-bold text-blue-600'>
                {latestMotorData.leftSpeed.toFixed(2)}
              </div>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-sm text-gray-600'>右馬達速度</div>
              <div className='text-lg font-bold text-green-600'>
                {latestMotorData.rightSpeed.toFixed(2)}
              </div>
            </div>
            <div className='text-center p-3 bg-orange-50 rounded-lg'>
              <div className='text-sm text-gray-600'>左馬達功率</div>
              <div className='text-lg font-bold text-orange-600'>
                {latestMotorData.leftDuty}%
              </div>
            </div>
            <div className='text-center p-3 bg-purple-50 rounded-lg'>
              <div className='text-sm text-gray-600'>右馬達功率</div>
              <div className='text-lg font-bold text-purple-600'>
                {latestMotorData.rightDuty}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 接收數據日誌 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Database className='w-5 h-5' />
              接收數據日誌 ({receivedData.length})
            </span>
            {receivedData.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={onClearData}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='w-4 h-4 mr-1' />
                清除
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto'>
            {receivedData.length === 0 ? (
              <p className='text-gray-500 text-sm'>尚無接收數據</p>
            ) : (
              <div className='space-y-2'>
                {receivedData.map((data) => (
                  <div key={data.id} className='bg-white rounded p-3 border'>
                    <div className='flex items-center justify-between mb-2'>
                      <Badge variant='outline' className='text-xs'>
                        {data.timestamp}
                      </Badge>
                      {/* <Badge className='text-xs'>
                        {data.description}
                      </Badge> */}
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm'>
                      <div>
                        <span className='text-gray-600'>命令:</span>
                        <span className='ml-2 font-mono'>
                          {data.cmd0.toString(16).padStart(2, '0').toUpperCase()} 
                          {data.cmd1.toString(16).padStart(2, '0').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-600'>數值:</span>
                        <span className='ml-2 font-bold text-blue-600'>
                          {data.parsedValue}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-600'>原始:</span>
                        <span className='ml-2 font-mono text-xs'>
                          {data.rawHex}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 