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
import { buildCommand, buildMapCommand } from '@/utils/BuildCommand';
import { useVehicleLogs, useVehicleStatus } from '@/hooks';

const Controller: FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
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
  useEffect(() => {
    setDisabled(trackMode !== 'manual');
  }, [trackMode]);

  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage.data;
    if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        const u8 = new Uint8Array(buf);
        const flag = u8ArrayToBool(u8);
        addLog(flag ? '指令執行成功' : '指令執行失敗', flag);
      });
    }
  }, [lastMessage, addLog]);

  const sendAutoControl = () => {
    if (readyState !== ReadyState.OPEN) return;
    let CarController = 'VehicleControl' as ControllerType;
    const buffers: Uint8Array[] = [];
    buffers.push(
      buildCommand({
        control: CarController,
        b1: 'Motion',
        arg: 'Forward',
      }),
    );
    buffers.push(
      buildCommand({
        control: CarController,
        b1: 'Speed',
        arg: 0x14,
      }),
    );
    buffers.push(
      buildCommand({
        control: CarController,
        b1: 'Mode',
        arg: 'Track',
      }),
    );
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
  };

  const sendCarCommand = (opts: CarCommandOpts) => {
    if (readyState !== ReadyState.OPEN) return;
    let CarController = 'VehicleControl' as ControllerType;
    const buffers: Uint8Array[] = [];

    if (opts.motion !== undefined) {
      buffers.push(
        buildCommand({
          control: CarController,
          b1: 'Motion',
          arg: opts.motion,
        }),
      );
    }
    if (opts.speed !== undefined) {
      buffers.push(
        buildCommand({
          control: CarController,
          b1: 'Speed',
          arg: opts.speed,
        }),
      );
    }
    if (opts.mode !== undefined) {
      buffers.push(
        buildCommand({
          control: CarController,
          b1: 'Mode',
          arg: opts.mode,
        }),
      );
    }
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
    const moving = opts.motion !== undefined && opts.motion !== 'Stop';
    updateMovementStatus(moving, opts.direction);
  };

  const sendMapCommand = (b2: MapCmdB2Type) => {
    let array = buildMapCommand({ b2 });
    sendMessage(array.buffer);
  };

  const sendMotorCommand = (opts: MotorCommandOpts) => {
    let CarController = 'WheelControl' as ControllerType;
    if (readyState !== ReadyState.OPEN) return;
    const buffers: Uint8Array[] = [];
    if (opts.motion !== undefined) {
      buffers.push(
        buildCommand({
          control: CarController,
          motor: opts.motor,
          b1: 'Motion',
          arg: opts.motion,
        }),
      );
    }
    if (opts.speed !== undefined) {
      buffers.push(
        buildCommand({
          control: CarController,
          motor: opts.motor,
          b1: 'Speed',
          arg: opts.speed,
        }),
      );
    }
    buffers.push(
      buildCommand({
        control: CarController,
        motor: opts.motor,
        b1: 'Mode',
        arg: 'Free',
      }),
    );
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
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
  const isDisabled = readyState !== ReadyState.OPEN;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
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
          disabled={isDisabled || disabled}
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
            disabled={isDisabled || disabled}
          />
        </div>
      </div>

      <SystemLogs logs={logs} onClearLogs={clearLogs} />
    </div>
  );
};

export default Controller;
