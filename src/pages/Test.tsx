import { CmdB1, CmdB2 } from '@/types';
import { concatUint8Arrays } from '@/utils';
import { buildCarCommand } from '@/utils/vehicle';

function BufferShow(name: string, cmd: Uint8Array) {
  console.log(
    name,
    Array.from(cmd)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
  );
}

const Test = () => {
  const cmd = buildCarCommand(CmdB1.Mode, CmdB2.Mode.Free);
  BufferShow('Mode: ', cmd);
  const cmd1 = buildCarCommand(CmdB1.Motion, CmdB2.Motion.Forward);
  BufferShow('Motion: ', cmd1);
  const cmd2 = buildCarCommand(CmdB1.Speed, 40);
  BufferShow('Speed: ', cmd2);
  const all_cmd = concatUint8Arrays(cmd1, cmd2, cmd);
  BufferShow('All: ', all_cmd);
  return <div>Text</div>;
};

export default Test;
