import { HomePage, } from './HomePage';
import { ControlPage, ControlRouteConfig } from './ControlPage';
import { RoboticPage, RoboticRouteConfig } from './RoboticPage';
import { DataPage, DataRouteConfig } from './DataPage';
import { UsbCANPage, UsbCANRouteConfig } from './UsbCANPage';

const navRoutes = [
  ControlRouteConfig,
  DataRouteConfig,
  RoboticRouteConfig,
  UsbCANRouteConfig,
];

export {
  navRoutes, HomePage,
  ControlRouteConfig, DataRouteConfig, RoboticRouteConfig, UsbCANRouteConfig,
  ControlPage, DataPage, RoboticPage, UsbCANPage
};
