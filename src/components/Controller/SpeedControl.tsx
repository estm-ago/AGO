import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Gauge } from 'lucide-react';

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const SpeedControl: FC<SpeedControlProps> = ({ speed, onSpeedChange }) => {
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onSpeedChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const value = Number.isNaN(raw) ? 0 : raw;
    onSpeedChange(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Gauge className='w-5 h-5' />
          速度控制
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <label htmlFor='speed' className='text-sm font-medium'>
            速度: {speed}%
          </label>
          <input
            id='speed'
            type='range'
            min='0'
            max='100'
            step='5'
            value={speed}
            onChange={handleRangeChange}
            className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600'
          />
          <div className='flex justify-between text-xs text-gray-500'>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <div className='space-y-2'>
          <label htmlFor='speed-input' className='text-sm font-medium'>
            精確設定
          </label>
          <input
            id='speed-input'
            type='number'
            value={speed}
            onChange={handleInputChange}
            min={0}
            max={100}
            step={1}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
      </CardContent>
    </Card>
  );
};
