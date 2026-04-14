import { type FC } from "react";
import {
  type WebCANConsoleProps,
} from '@/types';
import WebCANConsole from "./can_web";
import LocalCANConsole from "./can_local";
import FdCANConsole from "./fdcan";

const CANConsole: FC<WebCANConsoleProps> = (props) =>
{
  return (
    <>
      <FdCANConsole/>
      {/* <LocalCANConsole/>
      <WebCANConsole {...props}/> */}
    </>
  );
};

export default CANConsole;
