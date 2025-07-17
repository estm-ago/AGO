import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Car, Database, Wifi } from 'lucide-react';
import { ReadyState } from 'react-use-websocket';

interface NavbarProps {
  controlReadyState?: ReadyState;
  dataReadyState?: ReadyState;
}

export const Navbar: FC<NavbarProps> = ({ controlReadyState, dataReadyState }) => {
  const location = useLocation();

  const getConnectionBadge = (readyState?: ReadyState) => {
    if (readyState === undefined) {
      return <div className='w-2 h-2 rounded-full bg-gray-400'></div>;
    }

    const isConnected = readyState === ReadyState.OPEN;
    return (
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      ></div>
    );
  };

  return (
    <nav className='bg-white shadow-lg border-b'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo/Title */}
          <div className='flex items-center'>
            <Wifi className='w-8 h-8 text-blue-600 mr-3' />
            <h1 className='text-xl font-bold text-gray-900'>ESP32 車輛系統</h1>
          </div>

          {/* Navigation Links */}
          <div className='flex space-x-4'>
            <Link to='/control'>
              <Button
                variant={location.pathname === '/control' ? 'default' : 'outline'}
                className='flex items-center gap-2'
              >
                <Car className='w-4 h-4' />
                車輛控制
                {getConnectionBadge(controlReadyState)}
              </Button>
            </Link>

            <Link to='/data'>
              <Button
                variant={location.pathname === '/data' ? 'default' : 'outline'}
                className='flex items-center gap-2'
              >
                <Database className='w-4 h-4' />
                數據接收
                {getConnectionBadge(dataReadyState)}
              </Button>
            </Link>
            <Link to='/robotic'>
              <Button
                variant={location.pathname === '/robotic' ? 'default' : 'outline'}
                className='flex items-center gap-2'
              >
                <Database className='w-4 h-4' />
                機器手臂控制
                {getConnectionBadge(dataReadyState)}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
