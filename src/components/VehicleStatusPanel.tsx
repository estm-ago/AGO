import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity } from 'lucide-react';

interface VehicleStatusPanelProps {
  isMoving: boolean;
  currentDirection: string;
  speed: number;
}

export const VehicleStatusPanel: FC<VehicleStatusPanelProps> = ({
  isMoving,
  currentDirection,
  speed,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Activity className='w-5 h-5' />
          車輛狀態
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium'>運動狀態:</span>
          <Badge className={isMoving ? 'bg-green-500' : 'bg-gray-500'}>
            {isMoving ? '移動中' : '靜止'}
          </Badge>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium'>方向:</span>
          <Badge variant='outline'>{currentDirection}</Badge>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium'>目標速度:</span>
          <Badge variant='outline'>{speed}%</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
