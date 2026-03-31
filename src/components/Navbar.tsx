import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Wifi } from 'lucide-react';
import { ReadyState } from 'react-use-websocket';
import { navRoutes } from '@/pages';

interface NavbarProps {
  controlReadyState?: ReadyState;
  dataReadyState?: ReadyState;
  robotReadyState?: ReadyState;
  serialReadyState?: ReadyState;
}

export const Navbar: FC<NavbarProps> = (props) => {
  const location = useLocation();

  const stateMap: Record<string, any> = {
    control: props.controlReadyState,
    data: props.dataReadyState,
    robot: props.robotReadyState,
    serial: props.serialReadyState,
  };

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
            {navRoutes.map((item) => (
              <Link key={item.key} to={`/${item.key}`}>
                <Button
                  variant={location.pathname === `/${item.key}` ? 'default' : 'outline'}
                  className='flex items-center gap-2'
                >
                  <item.icon className='w-4 h-4' />
                  {item.label}
                  {getConnectionBadge(stateMap[item.key])}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
