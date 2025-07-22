import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface DirectionControlsProps {
  onForward: () => void;
  onBackward: () => void;
  onLeft: () => void;
  onRight: () => void;
  onStop: () => void;
  onLeftSpinForward: () => void;
  onRightSpinForward: () => void;
  onLeftSpinBack: () => void;
  onRightSpinBack: () => void;
  disabled: boolean;
}

export const DirectionControls: FC<DirectionControlsProps> = ({
  onForward,
  onBackward,
  onLeft,
  onRight,
  onStop,
  onLeftSpinForward,
  onRightSpinForward,
  onLeftSpinBack,
  onRightSpinBack,
  disabled,
}) => {
  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ArrowUp className='w-5 h-5' />
          方向控制
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 my-auto'>
        {/* 方向按鈕網格 */}
        <div className='grid grid-cols-3 gap-4 max-w-md mx-auto'>
          {/* 第一行 */}
          <div></div>
          <Button
            size='lg'
            className='h-16 w-full bg-blue-600 hover:bg-blue-700'
            onClick={onForward}
            disabled={disabled}
          >
            <ArrowUp className='w-6 h-6' />
          </Button>
          <div></div>

          {/* 第二行 */}
          <Button
            size='lg'
            className='h-16 w-full bg-blue-600 hover:bg-blue-700'
            onClick={onLeft}
            disabled={disabled}
          >
            <ArrowLeft className='w-6 h-6' />
          </Button>
          <Button
            size='lg'
            className='h-16 w-full bg-red-600 hover:bg-red-700'
            onClick={onStop}
            disabled={disabled}
          >
            <Square className='w-6 h-6' />
          </Button>
          <Button
            size='lg'
            className='h-16 w-full bg-blue-600 hover:bg-blue-700'
            onClick={onRight}
            disabled={disabled}
          >
            <ArrowRight className='w-6 h-6' />
          </Button>

          {/* 第三行 */}
          <div></div>
          <Button
            size='lg'
            className='h-16 w-full bg-blue-600 hover:bg-blue-700'
            onClick={onBackward}
            disabled={disabled}
          >
            <ArrowDown className='w-6 h-6' />
          </Button>
          <div></div>
        </div>

        {/* 旋轉控制 */}
        <div className='flex justify-center gap-4'>
          <Button
            size='lg'
            className='h-12 bg-purple-600 hover:bg-purple-700'
            onClick={onLeftSpinForward}
            disabled={disabled}
          >
            <RotateCcw className='w-5 h-5 mr-2' />
            左正轉
          </Button>
          <Button
            size='lg'
            className='h-12 bg-purple-600 hover:bg-purple-700'
            onClick={onRightSpinForward}
            disabled={disabled}
          >
            <RotateCw className='w-5 h-5 mr-2' />
            右正轉
          </Button>
        </div>
        <div className='flex justify-center gap-4'>
          <Button
            size='lg'
            className='h-12 bg-purple-600 hover:bg-purple-700'
            onClick={onLeftSpinBack}
            disabled={disabled}
          >
            <RotateCcw className='w-5 h-5 mr-2' />
            左反轉
          </Button>
          <Button
            size='lg'
            className='h-12 bg-purple-600 hover:bg-purple-700'
            onClick={onRightSpinBack}
            disabled={disabled}
          >
            <RotateCw className='w-5 h-5 mr-2' />
            右反轉
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
