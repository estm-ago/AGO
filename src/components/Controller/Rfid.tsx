import { useEffect, useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  //   DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MapCmdB2, type MapCmdB2Type } from '@/types';

type Props = {
  open: boolean;
  uid: number;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sendMapCommand: (b2: MapCmdB2Type) => void;
};
const Motion = {
  Forward: 'Forward',
  Backward: 'Backward',
  Left: 'Left',
  Right: 'Right',
} as const;
type Motion = (typeof Motion)[keyof typeof Motion];
const motionOptions: { value: Motion; label: string }[] = [
  { value: Motion.Forward, label: '前進' },
  { value: Motion.Backward, label: '後退' },
  { value: Motion.Left, label: '左轉' },
  { value: Motion.Right, label: '右轉' },
];
const motionToMapB2: Record<Motion, MapCmdB2Type> = {
  [Motion.Forward]: MapCmdB2.FORWARD,
  [Motion.Backward]: MapCmdB2.BACKWARD,
  [Motion.Left]: MapCmdB2.LEFT,
  [Motion.Right]: MapCmdB2.RIGHT,
};
const STORAGE_KEY = 'rfidFormList';

const Rfid: FC<Props> = ({ open, setOpen, uid, sendMapCommand }) => {
  interface FormState {
    name: string;
    motion: Motion;
  }
  const [form, setForm] = useState<FormState>(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as FormState[];
      if (savedList.length > 0) {
        return savedList[savedList.length - 1];
      }
    } catch {
      /* ignore parse error */
    }
    return { name: 'A', motion: Motion.Forward };
  });
  useEffect(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as FormState[];
      for (const entry of savedList) {
        const b2 = motionToMapB2[entry.motion];
        sendMapCommand(b2);
      }
    } catch {
      console.warn('無法解析', STORAGE_KEY);
    }
  }, []);

  const handleMotionChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      motion: value as Motion,
    }));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = () => {
    try {
      const savedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as FormState[];
      savedList.push(form);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedList));
    } catch {
      console.warn('localStorage寫入失敗');
    }
    console.log('Save 點了，表單值：', { ...form });
    const b2 = motionToMapB2[form.motion];
    console.log('對應的 MapCmdB2 值：', b2);
    sendMapCommand(b2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* <DialogTrigger asChild>
        <Button variant='outline'>Open Dialog</Button>
      </DialogTrigger> */}
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogHeader>
            <DialogTitle>編輯 RFID 動作</DialogTitle>
            <DialogDescription>卡號：{uid}</DialogDescription>
          </DialogHeader>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-3'>
            <Label htmlFor='name-1'>名稱</Label>
            <Input id='name-1' name='name' value={form.name} onChange={handleChange} />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='Motion'>方向</Label>
            <Select value={form.motion} onValueChange={handleMotionChange}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='請選擇方向' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>方向</SelectLabel>
                  {motionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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

export default Rfid;
