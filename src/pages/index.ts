import { ControlRouteConfig } from './ControlPage';
import { RoboticRouteConfig } from './RoboticPage';
import { DataRouteConfig } from './DataPage';
import { UsbCANRouteConfig } from './SerialPort';
import { WifiRouteConfig } from './Wifi';

const navRoutes = [
  UsbCANRouteConfig,
  WifiRouteConfig,
  ControlRouteConfig,
  DataRouteConfig,
  RoboticRouteConfig,
];

export * from './HomePage';
export * from './ControlPage';
export * from './DataPage';
export * from './RoboticPage';
export * from './SerialPort';
export * from './Wifi';
export { navRoutes };
