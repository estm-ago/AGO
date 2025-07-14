import { CmdB0, CmdB1, CmdB2 } from './define';
type CmdB0Type = (typeof CmdB0)[keyof typeof CmdB0];
type CmdB1Type = (typeof CmdB1)[keyof typeof CmdB1];
// type ErrorType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
type CmdB2Type<C extends keyof typeof CmdB2> = (typeof CmdB2)[C][keyof (typeof CmdB2)[C]];
type BuildCarCommandArgs =
  | [b1: (typeof CmdB1)['Mode'], arg: CmdB2Type<'Mode'>]
  | [b1: (typeof CmdB1)['Motion'], arg: CmdB2Type<'Motion'>]
  | [b1: (typeof CmdB1)['Speed'], speed: number];
type ArgTypeMap = {
  Mode: CmdB2Type<'Mode'>;
  Motion: CmdB2Type<'Motion'>;
  Speed: number;
};
type DataRequestType = (typeof CmdB1)['LeftSpeed' | 'RightSpeed' | 'LeftDuty' | 'RightDuty'];
export type {
  CmdB0Type,
  CmdB1Type,
  CmdB2Type,
  //   ErrorType,
  BuildCarCommandArgs,
  ArgTypeMap,
  DataRequestType,
};
export type * from './interfaces';
export { CmdB0, CmdB1, CmdB2 };
