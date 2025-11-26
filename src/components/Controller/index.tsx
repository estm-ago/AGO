import { useEffect, useState, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { ReadyState } from 'react-use-websocket';
import { VehicleHeader } from './VehicleHeader';
import { DirectionControls } from './DirectionControls';
import { SpeedControl } from './SpeedControl';
import { VehicleStatusPanel } from './VehicleStatusPanel';
import { SystemLogs } from './SystemLogs';
import { concatUint8Arrays, u8ArrayToBool } from '@/utils';
import {
  type CarCommandOpts,
  type ControllerType,
  type MapCmdB2Type,
  type MotorCommandOpts,
} from '@/types';
import { buildVehicleCommand, buildMapCommand } from '@/utils/BuildCommand';
import { useVehicleLogs, useVehicleStatus, type WSCanFrame } from '@/hooks';
import Rfid from './Rfid';
import type { CANPortConfig, SetCANPortConfig } from '../SerialConsole/serialPortHelpers';
import { sendWSCanFrame } from '../SerialConsole/WSCanSendReceive';

export interface ControllerProps extends WebSocketHook {
  CANPortConfig: CANPortConfig;
  setCANPortConfig: SetCANPortConfig;
}

export async function sendCMD(
  webSktState: ReadyState,
  sendMessage: (data: ArrayBufferLike | string) => void,
  CANPortConfig: CANPortConfig,
  setCANPortConfig: SetCANPortConfig,
  buffers: Uint8Array[]
): Promise<void> {
  if (buffers.length === 0) return;
  if (webSktState == ReadyState.OPEN)
  {
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
  }
  if (CANPortConfig.readyState == ReadyState.OPEN) 
  {
    for (const buf of buffers)
    {
      const frame: WSCanFrame = {
        id: 0x123,
        extended: false,
        rtr: false,
        dlc: buf.length,
        data: buf,
      };
      await sendWSCanFrame(frame, CANPortConfig, setCANPortConfig);
    }
  }
}

const Controller: FC<ControllerProps> = ({ sendMessage, lastMessage, readyState, CANPortConfig, setCANPortConfig }) => {
  const {
    speed,
    isMoving,
    currentDirection,
    updateSpeed,
    updateMovementStatus,
    getConnectionStatus,
  } = useVehicleStatus();

  const { logs, addLog, clearLogs } = useVehicleLogs();
  const [trackMode, setTrackMode] = useState<'manual' | 'auto'>('manual');
  const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<number>(0);
  useEffect(() => {
    setDisabled(trackMode !== 'manual');
  }, [trackMode]);

  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage.data;
    if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        const u8 = new Uint8Array(buf);
        if (u8.length === 6) {
          console.log('收到 RFID：', u8);
          const last4 = u8.subarray(u8.length - 4);
          const num = new DataView(last4.buffer, last4.byteOffset, last4.byteLength).getUint32(
            0,
            false,
          );

          console.log('解析後的 RFID 值: ', num);
          setUid(num);
          setOpen(true);
          return;
        }
        const flag = u8ArrayToBool(u8);
        addLog(flag ? '指令執行成功' : '指令執行失敗', flag);
      });
    }
  }, [lastMessage, addLog]);

  const sendAutoControl = async () => {
    let CarController = 'VehicleControl' as ControllerType;
    const buffers: Uint8Array[] = [];
    buffers.push(
      buildVehicleCommand({
        control: CarController,
        b1: 'Motion',
        arg: 'Forward',
      }),
    );
    buffers.push(
      buildVehicleCommand({
        control: CarController,
        b1: 'Speed',
        arg: speed,
      }),
    );
    buffers.push(
      buildVehicleCommand({
        control: CarController,
        b1: 'Mode',
        arg: 'Track',
      }),
    );
    await sendCMD(readyState, sendMessage, CANPortConfig, setCANPortConfig, buffers);
  };

  const sendCarCommand = async (opts: CarCommandOpts) => {
    let CarController = 'VehicleControl' as ControllerType;
    const buffers: Uint8Array[] = [];

    if (opts.motion !== undefined) {
      buffers.push(
        buildVehicleCommand({
          control: CarController,
          b1: 'Motion',
          arg: opts.motion,
        }),
      );
    }
    if (opts.speed !== undefined) {
      buffers.push(
        buildVehicleCommand({
          control: CarController,
          b1: 'Speed',
          arg: opts.speed,
        }),
      );
    }
    if (opts.mode !== undefined) {
      buffers.push(
        buildVehicleCommand({
          control: CarController,
          b1: 'Mode',
          arg: opts.mode,
        }),
      );
    }
    await sendCMD(readyState, sendMessage, CANPortConfig, setCANPortConfig, buffers);
    const moving = opts.motion !== undefined && opts.motion !== 'Stop';
    updateMovementStatus(moving, opts.direction);
  };

  const sendMapCommand = (b2: MapCmdB2Type) => {
    let array = buildMapCommand({ b2 });
    sendMessage(array.buffer);
  };

  const sendMotorCommand = async (opts: MotorCommandOpts) => {
    let CarController = 'WheelControl' as ControllerType;
    const buffers: Uint8Array[] = [];
    if (opts.motion !== undefined) {
      buffers.push(
        buildVehicleCommand({
          control: CarController,
          motor: opts.motor,
          b1: 'Motion',
          arg: opts.motion,
        }),
      );
    }
    if (opts.speed !== undefined) {
      buffers.push(
        buildVehicleCommand({
          control: CarController,
          motor: opts.motor,
          b1: 'Speed',
          arg: opts.speed,
        }),
      );
    }
    buffers.push(
      buildVehicleCommand({
        control: CarController,
        motor: opts.motor,
        b1: 'Mode',
        arg: 'Free',
      }),
    );
    await sendCMD(readyState, sendMessage, CANPortConfig, setCANPortConfig, buffers);
    const moving = opts.motion !== undefined && opts.motion !== 'Stop';
    updateMovementStatus(moving, opts.direction);
  };

  const handleStop = () => {
    sendCarCommand({
      mode: 'Free',
      direction: '停止',
      motion: 'Stop',
    });
  };

  const handleForward = () => {
    sendCarCommand({
      direction: '前進',
      motion: 'Forward',
      speed,
      mode: 'Free',
    });
  };

  const handleBackward = () => {
    sendCarCommand({
      direction: '後退',
      motion: 'Backward',
      speed,
      mode: 'Free',
    });
  };

  const handleLeft = () => {
    sendCarCommand({
      mode: 'Free',
      motion: 'Left',
      speed,
      direction: '左轉',
    });
  };

  const handleRight = () => {
    sendCarCommand({
      mode: 'Free',
      motion: 'Right',
      speed,
      direction: '右轉',
    });
  };

  const handleLeftSpinForward = () => {
    sendMotorCommand({
      motor: 'Wheel_Left',
      motion: 'Forward',
      speed,
      direction: '左正轉',
    });
  };

  const handleRightSpinForward = () => {
    sendMotorCommand({
      motor: 'Wheel_Right',
      motion: 'Forward',
      speed,
      direction: '右正轉',
    });
  };

  const handleLeftSpinBack = () => {
    sendMotorCommand({
      motor: 'Wheel_Left',
      motion: 'Backward',
      speed,
      direction: '左反轉',
    });
  };

  const handleRightSpinBack = () => {
    sendMotorCommand({
      motor: 'Wheel_Right',
      motion: 'Backward',
      speed,
      direction: '右反轉',
    });
  };

  const connectionStatus = getConnectionStatus(readyState);
  const webSktIsDisabled = readyState !== ReadyState.OPEN;
  const canIsDisabled = CANPortConfig.readyState !== ReadyState.OPEN;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      {(trackMode === 'auto' || open) && (
        <Rfid uid={uid} open={open} setOpen={setOpen} sendMapCommand={sendMapCommand} />
      )}
      <VehicleHeader connectionStatus={connectionStatus} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <DirectionControls
          onForward={handleForward}
          onBackward={handleBackward}
          onLeft={handleLeft}
          onRight={handleRight}
          onStop={handleStop}
          onLeftSpinForward={handleLeftSpinForward}
          onRightSpinForward={handleRightSpinForward}
          onLeftSpinBack={handleLeftSpinBack}
          onRightSpinBack={handleRightSpinBack}
          disabled={(webSktIsDisabled && canIsDisabled) || disabled}
        />

        <div className='space-y-6'>
          <SpeedControl speed={speed} onSpeedChange={updateSpeed} trackMode={trackMode} />
          <VehicleStatusPanel
            isMoving={isMoving}
            currentDirection={currentDirection}
            speed={speed}
            trackMode={trackMode}
            setTrackMode={setTrackMode}
            sendAutoControl={sendAutoControl}
            disabled={(webSktIsDisabled && canIsDisabled) || disabled}
          />
        </div>
      </div>

      <SystemLogs logs={logs} onClearLogs={clearLogs} />
    </div>
  );
};

export default Controller;
