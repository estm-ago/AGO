import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Activity, Trash2 } from 'lucide-react';
import type { LogEntry } from '@/types';

interface SystemLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const SystemLogs: FC<SystemLogsProps> = ({ logs, onClearLogs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            系統日誌
          </span>
          {logs.length > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={onClearLogs}
              className='text-red-600 hover:text-red-700'
            >
              <Trash2 className='w-4 h-4 mr-1' />
              清除
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='bg-gray-50 rounded-lg p-4 h-32 overflow-y-auto'>
          {logs.length === 0 ? (
            <p className='text-gray-500 text-sm'>尚無日誌記錄</p>
          ) : (
            <div className='space-y-1'>
              {logs.map((log, index) => (
                <div key={index} className='text-sm font-mono'>
                  <span className='text-gray-500'>{log.timestamp}</span>
                  <span className={`ml-2 ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
