import { CmdB0, CmdB1, CmdB2 } from './define';
type CmdB0Type = (typeof CmdB0)[keyof typeof CmdB0];
type CmdB1Type = (typeof CmdB1)[keyof typeof CmdB1];
type CmdB2Type<C extends keyof typeof CmdB2> = C extends 'Speed' ? number : keyof (typeof CmdB2)[C];
type ControllerType = Extract<keyof typeof CmdB0, 'VehicleControl' | 'WheelControl'>;
type BuildCommandArgs = {
  [B in Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>]: [
    control: ControllerType,
    b1: B,
    arg: CmdB2Type<B>,
  ];
}[Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>];
type DataRequestType = (typeof CmdB1)['LeftSpeed' | 'RightSpeed' | 'LeftDuty' | 'RightDuty'];
export type { CmdB0Type, CmdB1Type, CmdB2Type, BuildCommandArgs, DataRequestType, ControllerType };
export type * from './interfaces';
export { CmdB0, CmdB1, CmdB2 };
