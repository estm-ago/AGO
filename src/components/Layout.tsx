import { type FC, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ReadyState } from 'react-use-websocket';

interface LayoutProps {
  children?: ReactNode;
  controlReadyState?: ReadyState;
  dataReadyState?: ReadyState;
  robotReadyState?: ReadyState;
  serialReadyState?: ReadyState;
}

export const Layout: FC<LayoutProps> = ({ controlReadyState, dataReadyState, robotReadyState, serialReadyState }) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar
        controlReadyState={controlReadyState}
        dataReadyState={dataReadyState}
        robotReadyState={robotReadyState}
        serialReadyState={serialReadyState}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
