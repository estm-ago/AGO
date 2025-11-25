import {
  ArmCmdB2,
  CmdB0,
  CmdB1,
  CmdB2,
  MapCmdB1,
  type BuildRobotCommandArgs,
  type BuildTrackCommandArgs,
  type CmdB2Type,
  type ControllerType,
  type DataRequestType,
} from '@/types';

const standard_can = [
  0xAA, 0x55, 0x01, 0x01, 0x01,
  0x00, 0x00, 0x08,
  0x00,
];
function buildCanCommand(arg: string): Uint8Array
{
  const buf = new ArrayBuffer(20);
  const dv = new DataView(buf);
  for (let i = 0; i <= 4; i++) {
    dv.setUint8(i, standard_can[i]);
  }
  dv.setUint8(5, 0x23);
  dv.setUint8(6, 0x01);
  for (let i = 7; i <= 9; i++)
  {
    dv.setUint8(i, standard_can[i-2]);
  }
  const parts = arg.trim().split(/\s+/);
  parts.forEach((p, i) =>
  {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 0xff)
    {
      throw new Error(`無效的十六進位: "${p}"`);
    }
    dv.setUint8(10 + i, v);
  });
  dv.setUint8(18, standard_can[8]);
  let sum = 0;
  for (let i = 2; i <= 18; i++)
  {
    sum += dv.getUint8(i);
  }
  dv.setUint8(19, sum & 0xff);

  return new Uint8Array(buf);
}

interface buildVehicleCommandArgs<B extends Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>> {
  control: ControllerType;
  b1: B;
  arg: CmdB2Type<B>;
  motor?: Extract<keyof typeof CmdB1, 'Wheel_Left' | 'Wheel_Right'>;
}

function buildVehicleCommand<B extends Extract<keyof typeof CmdB1, 'Mode' | 'Motion' | 'Speed'>>(
  options: buildVehicleCommandArgs<B>,
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
    // if (value < 0 || value > 100) {
    //   throw new RangeError('Value must be between 0 and 100');
    // }
    dv.setUint8(3, value);
  }
  return new Uint8Array(buf);
}
function buildMapCommand(opts: BuildTrackCommandArgs): Uint8Array {
  const { b2 } = opts;
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0.MapControl);
  dv.setUint8(1, MapCmdB1.Set);
  dv.setUint8(2, b2);
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

export {
  buildCanCommand,
  buildVehicleCommand,
  buildDataRequestCommand,
  DATA_REQUEST_COMMANDS,
  buildRobotCommand,
  buildMapCommand,
};
