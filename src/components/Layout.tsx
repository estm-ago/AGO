import { type FC, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}; 