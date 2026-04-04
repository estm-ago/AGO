import { type FC } from "react";
import {
  type WebCANConsoleProps,
} from '@/types';
import WebCANConsole from "./web";
import LocalCANConsole from "./local";

const CANConsole: FC<WebCANConsoleProps> = (props) =>
{
  return (
    <>
      <LocalCANConsole/>
      <WebCANConsole {...props}/>
    </>
  );
};

export default CANConsole;
