import {
  CmdB0,
  CmdB1,
  type ArgTypeMap,
  type BuildCarCommandArgs,
  type DataRequestType,
} from '@/types';

function buildCarCommand<C extends keyof ArgTypeMap>(
  b1: (typeof CmdB1)[C],
  arg: ArgTypeMap[C],
): Uint8Array;
function buildCarCommand(...args: BuildCarCommandArgs): Uint8Array {
  const [b1, arg2] = args;
  if (b1 === CmdB1.Speed) {
    const speed = arg2 as number;
    if (speed < 0 || speed > 100) {
      throw new RangeError('Speed must be between 0 and 100');
    }
  }
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0.VehicleControl);
  dv.setUint8(1, b1);
  dv.setUint8(2, arg2 as number);
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

export { buildCarCommand, buildDataRequestCommand, DATA_REQUEST_COMMANDS };
