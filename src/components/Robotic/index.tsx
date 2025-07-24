import { useVehicleLogs, useVehicleStatus } from '@/hooks';
import { useEffect, useState, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { Header } from './Header';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RotateCcw, Settings, Square, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { buildRobotCommand, u8ArrayToBool } from '@/utils';
import { ArmCmdB1, ArmCmdB2 } from '@/types';
import { ReadyState } from 'react-use-websocket';

const Robotic: FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
  const { getConnectionStatus } = useVehicleStatus();
  const connectionStatus = getConnectionStatus(readyState);
  const isDisabled = readyState !== ReadyState.OPEN;
  // const { logs, addLog, clearLogs } = useVehicleLogs();
  const { addLog } = useVehicleLogs();
  const [isMoving, setIsMoving] = useState(false);
  // const [armStatus, setArmStatus] = useState('待機');

  const JOINTS = [
    { key: 'bottom', label: '底座（馬達）', range: [0, 100], initial: 0, cmd: ArmCmdB1.Buttom },
    // { key: 'shoulder', label: '肩膀', range: [0, 100], initial: 45, cmd: ArmCmdB1.Shoulder },
    {
      key: 'elbowBottom',
      label: '肘部下方',
      range: [0, 100],
      initial: 90,
      cmd: ArmCmdB1.Elbow_Btm,
    },
    { key: 'elbowTop', label: '肘部上方', range: [0, 100], initial: 90, cmd: ArmCmdB1.Elbow_Top },
    { key: 'wrist', label: '手腕', range: [0, 100], initial: 0, cmd: ArmCmdB1.Wrist },
    { key: 'finger', label: '夾爪', range: [0, 50], initial: 50, cmd: ArmCmdB1.Finger },
    // { key: 'arm', label: '手臂', range: [0, 100], initial: 0, cmd: ArmCmdB1.Arm },
  ];
  type JointKey = (typeof JOINTS)[number]['key'];
  type JointState = Record<JointKey, number>;
  type SavedPosition = {
    name: string;
    values: JointState;
  };
  const makeInitialJoints = (): JointState => {
    return JOINTS.reduce((acc, { key, initial }) => {
      acc[key] = initial;
      return acc;
    }, {} as JointState);
  };
  const [savedPositions] = useState<SavedPosition[]>([
    {
      name: '待機位置',
      values: makeInitialJoints(),
    },
    {
      name: '工作位置',
      values: {
        bottom: 75,
        elbowBottom: 0,
        elbowTop: 25,
        wrist: 50,
        finger: 0,
      },
    },
    {
      name: '收納位置',
      values: {
        bottom: 25,
        elbowBottom: 0,
        elbowTop: 25,
        wrist: 50,
        finger: 0,
      },
    },
  ]);

  // const loadPosition = (pos: SavedPosition) => {
  //   setIsMoving(true);
  //   setJoints(pos.values);
  //   const def = JOINTS.find((j) => j.key === key)!;
  //   const command = buildRobotCommand({
  //     b1: def.cmd,
  //     b2: ArmCmdB2.Set,
  //     value: val,
  //   });
  //   // sendMessage(command);
  //   setTimeout(() => {
  //     sendMessage(command);
  //   }, 500);
  //   //Todo: 發送位置指令
  // };
  const loadPosition = (pos: SavedPosition) => {
    setIsMoving(true);
    setJoints(pos.values);
    const entries = Object.entries(pos.values) as [JointKey, number][];

    entries.forEach(([key, val], _) => {
      const def = JOINTS.find((j) => j.key === key)!;
      const cmd = buildRobotCommand({
        b1: def.cmd,
        b2: ArmCmdB2.Set,
        value: val,
      });
      // setTimeout(() => {
      //   sendMessage(cmd);
      //   addLog(`載入 ${def.label} → ${val}°`, true);
      // }, idx * 200);
      sendMessage(cmd);
    });

    const totalDelay = entries.length * 200;
    setTimeout(() => setIsMoving(false), totalDelay);
  };
  const emergencyStop = () => {
    //Todo: 發送緊急停止指令
    setIsMoving(false);
    const b1Commands = Object.values(ArmCmdB1) as (typeof ArmCmdB1)[keyof typeof ArmCmdB1][];
    b1Commands.forEach((b1Cmd, idx) => {
      const stopCmd = buildRobotCommand({
        b1: b1Cmd,
        b2: ArmCmdB2.Stop,
        value: 0,
      });
      setTimeout(() => {
        sendMessage(stopCmd);
        addLog(`緊急停止：b1=0x${b1Cmd.toString(16)}`, true);
      }, idx * 100);
    });

    // setTimeout(() => setArmStatus('待機'), 3000);
  };
  const resetAllJoints = () => {
    setJoints(
      JOINTS.reduce((acc, { key }) => {
        acc[key] = 0;
        return acc;
      }, {} as JointState),
    );
  };
  const [joints, setJoints] = useState<JointState>(makeInitialJoints());
  const updateJoint = (key: JointKey, [val]: number[]) => {
    setJoints((prev) => ({ ...prev, [key]: val }));
    const def = JOINTS.find((j) => j.key === key)!;
    const command = buildRobotCommand({
      b1: def.cmd,
      b2: ArmCmdB2.Set,
      value: val,
    });
    // sendMessage(command);
    setTimeout(() => {
      sendMessage(command);
    }, 500);
  };
  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage.data;
    if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        const u8 = new Uint8Array(buf);
        const flag = u8ArrayToBool(u8);
        addLog(flag ? '指令執行成功' : '指令執行失敗', flag);
        console.log(flag ? '指令執行成功' : '指令執行失敗', flag);
      });
    }
  }, [lastMessage, addLog]);
  return (
    <div className='max-w-4xl  mx-auto p-6 space-y-6'>
      <Header connectionStatus={connectionStatus} />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              機械手臂控制系統
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {JOINTS.map(({ key, label, range: [min, max] }) => (
                <div key={key} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <Label className='text-sm font-medium'>{label}</Label>
                    <span className='text-sm text-gray-600'>{joints[key]}°</span>
                  </div>
                  <Slider
                    disabled={isDisabled || isMoving}
                    value={[joints[key]]}
                    onValueChange={(val) => updateJoint(key, val)}
                    min={min}
                    max={max}
                    step={1}
                    className='w-full'
                  />
                </div>
              ))}
            </div>
            <div className='space-y-4'>
              <div className='mt-6 space-y-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <Button
                    onClick={resetAllJoints}
                    variant='outline'
                    disabled={isDisabled || isMoving}
                  >
                    <RotateCcw /> 歸零
                  </Button>
                  <Button onClick={emergencyStop} variant='destructive' disabled={isDisabled}>
                    <Square /> 緊急停止
                  </Button>
                </div>

                <div className='space-y-2'>
                  <Label>預設位置</Label>
                  <div className='space-y-2'>
                    {savedPositions.map((pos, i) => (
                      <Button
                        key={i}
                        onClick={() => loadPosition(pos)}
                        variant='outline'
                        disabled={isDisabled || isMoving}
                        className='w-full justify-start'
                      >
                        <Target className='mr-2' /> {pos.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Robotic;
