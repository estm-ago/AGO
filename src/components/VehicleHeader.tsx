import { type FC } from 'react';
import { Card, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings } from 'lucide-react';
import { type ConnectionStatus } from '../types/vehicle';

interface VehicleHeaderProps {
  connectionStatus: ConnectionStatus;
}

export const VehicleHeader: FC<VehicleHeaderProps> = ({ connectionStatus }) => {
  const ConnectionIcon = connectionStatus.icon;

  return (
    <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between text-2xl font-bold text-gray-800'>
          <span className='flex items-center gap-2'>
            <Settings className='w-6 h-6' />
            車輛遙控系統
          </span>
          <Badge className={`${connectionStatus.color} text-white px-3 py-1`}>
            <ConnectionIcon className='w-4 h-4 mr-1' />
            {connectionStatus.text}
          </Badge>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};
