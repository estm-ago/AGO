import { type FC } from 'react';

interface TrackProps {
  trackMode: 'manual' | 'auto';
  setTrackMode: React.Dispatch<React.SetStateAction<'manual' | 'auto'>>;
  sendAutoControl: () => void;
  disabled: boolean;
}

const Track: FC<TrackProps> = ({ trackMode, setTrackMode, sendAutoControl, disabled }) => {
  const Manual_Control = () => {
    setTrackMode('manual');
  };
  const Auto_Control = () => {
    sendAutoControl();
    setTrackMode('auto');
  };

  return (
    <div className='bg-white/10 backdrop-blur-md rounded-2xl p-6'>
      {/* 模式切換器 */}
      <div className='flex items-center justify-center'>
        <div className='relative bg-black/20 rounded-full p-1 backdrop-blur-sm'>
          <div
            className={`absolute top-1 bottom-1 w-1/2 rounded-full transition-all duration-300 ease-in-out shadow-lg ${
              trackMode === 'manual' ? 'left-1' : 'left-1/2'
            } ${disabled ? 'bg-transparent' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
          />
          <div className='relative flex'>
            <button
              onClick={Manual_Control}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 z-10 ${
                trackMode === 'manual'
                  ? 'text-white shadow-sm'
                  : 'text-white/70 hover:text-white/90'
              }`}
              disabled={disabled}
            >
              手動模式
            </button>
            <button
              onClick={Auto_Control}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 z-10 ${
                trackMode === 'auto' ? 'text-white shadow-sm' : 'text-white/70 hover:text-white/90'
              }`}
              disabled={disabled}
            >
              自動模式
            </button>
          </div>
        </div>
      </div>

      {/* 當前模式指示 */}
      <div className='text-center mt-4 text-sm text-black/60'>
        當前模式:{' '}
        <span className='font-semibold text-black/90'>
          {trackMode === 'manual' ? '手動控制' : '自動追蹤'}
        </span>
      </div>
    </div>
  );
};

export default Track;
