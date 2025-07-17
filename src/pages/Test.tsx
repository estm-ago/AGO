import { ArmCmdB1, ArmCmdB2 } from '@/types';
import { concatUint8Arrays } from '@/utils';
import { buildCommand, buildRobotCommand } from '@/utils/BuildCommand';

function BufferShow(name: string, cmd: Uint8Array) {
  console.log(
    name,
    Array.from(cmd)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
  );
}

const Test = () => {
  // const cmd = buildCommand(CmdB0.VehicleControl, CmdB1.Mode, CmdB2.Mode.Free);
  // BufferShow('Mode: ', cmd);
  // const cmd1 = buildCommand(CmdB0.VehicleControl, CmdB1.Motion, CmdB2.Motion.Forward);
  // BufferShow('Motion: ', cmd1);
  // const cmd2 = buildCommand(CmdB0.VehicleControl, CmdB1.Speed, 40);
  // BufferShow('Speed: ', cmd2);
  // const all_cmd = concatUint8Arrays(cmd1, cmd2, cmd);
  let buffers: Uint8Array[] = [];
  let all: Uint8Array = new Uint8Array(0);
  buffers.push(
    buildCommand({
      control: 'VehicleControl',
      b1: 'Motion',
      arg: 'Forward',
    }),
  );
  buffers.push(
    buildCommand({
      control: 'VehicleControl',
      b1: 'Speed',
      arg: 40,
    }),
  );
  buffers.push(
    buildCommand({
      control: 'VehicleControl',
      b1: 'Mode',
      arg: 'Free',
    }),
  );
  all = concatUint8Arrays(...buffers);
  buffers.length = 0;
  BufferShow('CarControlAll: ', all);
  buffers.push(
    buildCommand({
      control: 'WheelControl',
      motor: 'Wheel_Left',
      b1: 'Motion',
      arg: 'Forward',
    }),
  );
  buffers.push(
    buildCommand({
      control: 'WheelControl',
      motor: 'Wheel_Left',
      b1: 'Speed',
      arg: 40,
    }),
  );
  buffers.push(
    buildCommand({
      control: 'WheelControl',
      motor: 'Wheel_Left',
      b1: 'Mode',
      arg: 'Free',
    }),
  );
  // buffers.push(buildCommand(CmdB0.VehicleControl, CmdB1.Speed, 40));
  // buffers.push(buildCommand(CmdB0.WheelControl, CmdB1.Mode, CmdB2.Mode.Free));
  all = concatUint8Arrays(...buffers);
  buffers.length = 0; // 清空緩衝區
  BufferShow('MotorControl: ', all);

  const robotCommand = buildRobotCommand({
    b1: ArmCmdB1.Buttom,
    b2: ArmCmdB2.Set,
    value: 40,
  });
  BufferShow('RobotCommand: ', robotCommand);

  return <div>Text</div>;
};

export default Test;
