import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
// import { ArmCmdB1, ArmCmdB2 } from '@/types';
// import { concatUint8Arrays } from '@/utils';
// import { buildCommand, buildRobotCommand } from '@/utils/BuildCommand';

// function BufferShow(name: string, cmd: Uint8Array) {
//   console.log(
//     name,
//     Array.from(cmd)
//       .map((b) => b.toString(16).padStart(2, '0'))
//       .join(' '),
//   );
// }

const Test = () => {
  // const cmd = buildCommand(CmdB0.VehicleControl, CmdB1.Mode, CmdB2.Mode.Free);
  // BufferShow('Mode: ', cmd);
  // const cmd1 = buildCommand(CmdB0.VehicleControl, CmdB1.Motion, CmdB2.Motion.Forward);
  // BufferShow('Motion: ', cmd1);
  // const cmd2 = buildCommand(CmdB0.VehicleControl, CmdB1.Speed, 40);
  // BufferShow('Speed: ', cmd2);
  // const all_cmd = concatUint8Arrays(cmd1, cmd2, cmd);
  // let buffers: Uint8Array[] = [];
  // let all: Uint8Array = new Uint8Array(0);
  // buffers.push(
  //   buildCommand({
  //     control: 'VehicleControl',
  //     b1: 'Motion',
  //     arg: 'Forward',
  //   }),
  // );
  // buffers.push(
  //   buildCommand({
  //     control: 'VehicleControl',
  //     b1: 'Speed',
  //     arg: 40,
  //   }),
  // );
  // buffers.push(
  //   buildCommand({
  //     control: 'VehicleControl',
  //     b1: 'Mode',
  //     arg: 'Free',
  //   }),
  // );
  // all = concatUint8Arrays(...buffers);
  // buffers.length = 0;
  // BufferShow('CarControlAll: ', all);
  // buffers.push(
  //   buildCommand({
  //     control: 'WheelControl',
  //     motor: 'Wheel_Left',
  //     b1: 'Motion',
  //     arg: 'Forward',
  //   }),
  // );
  // buffers.push(
  //   buildCommand({
  //     control: 'WheelControl',
  //     motor: 'Wheel_Left',
  //     b1: 'Speed',
  //     arg: 40,
  //   }),
  // );
  // buffers.push(
  //   buildCommand({
  //     control: 'WheelControl',
  //     motor: 'Wheel_Left',
  //     b1: 'Mode',
  //     arg: 'Free',
  //   }),
  // );
  // // buffers.push(buildCommand(CmdB0.VehicleControl, CmdB1.Speed, 40));
  // // buffers.push(buildCommand(CmdB0.WheelControl, CmdB1.Mode, CmdB2.Mode.Free));
  // all = concatUint8Arrays(...buffers);
  // buffers.length = 0; // 清空緩衝區
  // BufferShow('MotorControl: ', all);

  // const robotCommand = buildRobotCommand({
  //   b1: ArmCmdB1.Buttom,
  //   b2: ArmCmdB2.Set,
  //   value: 40,
  // });
  // BufferShow('RobotCommand: ', robotCommand);
  // const [name, setName] = useState('Pedro Duarte');
  // const [username, setUsername] = useState('@peduarte');

  interface FormState {
    name: string;
    username: string;
  }
  const [form, setForm] = useState<FormState>({
    name: 'Pedro Duarte',
    username: '@peduarte',
  });
  const [open, setOpen] = useState(true);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = () => {
    console.log('Save 點了，表單值：', { ...form });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-3'>
            <Label htmlFor='name-1'>Name</Label>
            <Input id='name-1' name='name' value={form.name} onChange={handleChange} />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='username-1'>Username</Label>
            <Input id='username-1' name='username' value={form.username} onChange={handleChange} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type='button' onClick={handleSave}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Test;
