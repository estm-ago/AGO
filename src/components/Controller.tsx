import { useEffect, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { ReadyState } from 'react-use-websocket';
import { useVehicleStatus } from '../hooks/useVehicleStatus';
import { useVehicleLogs } from '../hooks/useVehicleLogs';
import { VehicleHeader } from './VehicleHeader';
import { DirectionControls } from './DirectionControls';
import { SpeedControl } from './SpeedControl';
import { VehicleStatusPanel } from './VehicleStatusPanel';
import { SystemLogs } from './SystemLogs';
import { concatUint8Arrays, u8ArrayToBool } from '@/utils';
import { CmdB0, CmdB1, CmdB2, type CmdB2Type } from '@/types';
import { buildCarCommand } from '@/utils/BuildCommand';

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

  interface CommandOpts {
    mode?: CmdB2Type<'Mode'>;
    motion?: CmdB2Type<'Motion'>;
    speed?: number;
    direction: string;
  }

  const sendCarCommand = (opts: CommandOpts) => {
    if (readyState !== ReadyState.OPEN) return;
    const buffers: Uint8Array[] = [];

    if (opts.motion !== undefined) {
      buffers.push(buildCarCommand(CmdB1.Motion, opts.motion));
    }
    if (opts.speed !== undefined) {
      buffers.push(buildCarCommand(CmdB1.Speed, opts.speed));
    }
    if (opts.mode !== undefined) {
      buffers.push(buildCarCommand(CmdB1.Mode, opts.mode));
    }
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
    const moving = opts.motion !== CmdB2.Motion.Stop;
    updateMovementStatus(moving, opts.direction);
  };
  const sendMotorCommand = (opts: CommandOpts) => {
    let CarController = CmdB0.VehicleControl;
    if (readyState !== ReadyState.OPEN) return;
    const buffers: Uint8Array[] = [];
    if (opts.mode !== undefined) {
      buffers.push(buildCommand(CarController, CmdB1.Mode, opts.mode));
    }
    if (opts.motion !== undefined) {
      buffers.push(buildCommand(CarController, CmdB1.Motion, opts.motion));
    }
    if (opts.speed !== undefined) {
      buffers.push(buildCommand(CarController, CmdB1.Speed, opts.speed));
    }
    const all = concatUint8Arrays(...buffers);
    sendMessage(all.buffer);
    const moving = opts.motion !== CmdB2.Motion.Stop;
    updateMovementStatus(moving, opts.direction);
  };

  const handleStop = () => {
    sendCarCommand({ mode: CmdB2.Mode.Free, direction: '停止', motion: CmdB2.Motion.Stop });
  };

  const handleForward = () => {
    sendCarCommand({
      direction: '前進',
      motion: CmdB2.Motion.Forward,
      speed,
      mode: CmdB2.Mode.Free,
    });
  };

  const handleBackward = () => {
    sendCarCommand({
      direction: '後退',
      motion: CmdB2.Motion.Backward,
      speed,
      mode: CmdB2.Mode.Free,
    });
  };

  const handleLeft = () => {
    sendCarCommand({ mode: CmdB2.Mode.Free, motion: CmdB2.Motion.Left, speed, direction: '左轉' });
  };

  const handleRight = () => {
    sendCarCommand({ mode: CmdB2.Mode.Free, motion: CmdB2.Motion.Right, speed, direction: '右轉' });
  };

  const handleLeftSpinForward = () => {
    sendMotorCommand(CmdB1.Left, CmdB2.Forward, speed, '左正轉');
  };

  const handleRightSpinForward = () => {
    sendCommand(CmdB1.Right, CmdB2.Forward, speed, '右正轉');
  };

  const handleLeftSpinBack = () => {
    sendCommand(CmdB1.Left, CmdB2.Backward, speed, '左反轉');
  };

  const handleRightSpinBack = () => {
    sendCommand(CmdB1.Right, CmdB2.Backward, speed, '右反轉');
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
          disabled={isDisabled}
        />

        <div className='space-y-6'>
          <SpeedControl speed={speed} onSpeedChange={updateSpeed} />
          <VehicleStatusPanel
            isMoving={isMoving}
            currentDirection={currentDirection}
            speed={speed}
          />
        </div>
      </div>

      <SystemLogs logs={logs} onClearLogs={clearLogs} />
    </div>
  );
};

export default Controller;
