import { type FC } from "react";
import {
  type WebCANConsoleProps,
} from '@/types';
import WebCANConsole from "./web";
import UartPortOCComp from "./local";

const CANConsole: FC<WebCANConsoleProps> = (props) =>
{
  return (
    <>
      <WebCANConsole {...props}/>
      <UartPortOCComp/>
    </>
  );
};

export default CANConsole;
