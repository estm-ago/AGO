import {
  ArmCmdB2,
  CmdB0,
  CmdB1,
  CmdB2,
  type BuildRobotCommandArgs,
  type CmdB2Type,
  type ControllerType,
  type DataRequestType,
} from '@/types';
interface BuildCommandArgs<B extends Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>> {
  control: ControllerType;
  b1: B;
  arg: CmdB2Type<B>;
  motor?: Extract<keyof typeof CmdB1, 'Wheel_Left' | 'Wheel_Right'>;
}

function buildCommand<B extends Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>>(
  options: BuildCommandArgs<B>,
): Uint8Array {
  const { control, b1, arg, motor } = options;
  let speed_or_arg = b1 === 'Speed' ? arg : CmdB2[b1]?.[arg as keyof (typeof CmdB2)[typeof b1]];
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0[control]);
  if (control === 'VehicleControl' && motor === undefined) {
    dv.setUint8(1, CmdB1[b1]);
    dv.setUint8(2, speed_or_arg as number);
  } else if (control === 'WheelControl' && motor) {
    dv.setUint8(1, CmdB1[motor]);
    dv.setUint8(2, CmdB1[b1]);
  }
  if (b1 === 'Speed') {
    const speed = speed_or_arg as number;
    if (speed < 0 || speed > 100) {
      throw new RangeError('Speed must be between 0 and 100');
    }
    motor === undefined ? dv.setUint8(2, speed) : dv.setUint8(3, speed);
  }
  return new Uint8Array(buf);
}

function buildRobotCommand(opts: BuildRobotCommandArgs): Uint8Array {
  const { b1, b2, value } = opts;
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0.ArmControl);
  dv.setUint8(1, b1);
  dv.setUint8(2, b2);
  if (b2 === ArmCmdB2.Set && value !== undefined) {
    if (value < 0 || value > 100) {
      throw new RangeError('Value must be between 0 and 100');
    }
    dv.setUint8(3, value);
  }
  return new Uint8Array(buf);
}

// 構建數據請求命令
function buildDataRequestCommand(dataType: DataRequestType): Uint8Array {
  const buf = new ArrayBuffer(4);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0.DataControl); // 數據請求模式
  dv.setUint8(1, dataType); // 請求的數據類型
  return new Uint8Array(buf);
}

const DATA_REQUEST_COMMANDS = {
  leftSpeed: () => buildDataRequestCommand(CmdB1.LeftSpeed),
  rightSpeed: () => buildDataRequestCommand(CmdB1.RightSpeed),
  leftDuty: () => buildDataRequestCommand(CmdB1.LeftDuty),
  rightDuty: () => buildDataRequestCommand(CmdB1.RightDuty),
  allMotorData: () => [
    buildDataRequestCommand(CmdB1.LeftSpeed),
    buildDataRequestCommand(CmdB1.RightSpeed),
    buildDataRequestCommand(CmdB1.LeftDuty),
    buildDataRequestCommand(CmdB1.RightDuty),
  ],
};

export { buildCommand, buildDataRequestCommand, DATA_REQUEST_COMMANDS, buildRobotCommand };
