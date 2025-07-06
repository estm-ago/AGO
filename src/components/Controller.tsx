// import { useEffect, useState, type FC } from 'react';
// import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
// import { Button } from './ui/button';
// import { ReadyState } from 'react-use-websocket';
// const CmdB0 = {
//   VehicleControl: 0x10,
// };
// type CmdB0 = (typeof CmdB0)[keyof typeof CmdB0];
// const CmdB1 = {
//   VehicleStop: 0x00,
//   VehicleMove: 0x01,
//   LeftStop: 0x40,
//   LeftSpin: 0x41,
//   RightStop: 0x42,
//   RightSpin: 0x43,
// };
// type CmdB1 = (typeof CmdB1)[keyof typeof CmdB1];
// const CmdB2 = {
//   Forward: 0x00,
//   Backward: 0x01,
//   Left: 0x02,
//   Right: 0x03,
// };
// type CmdB2 = (typeof CmdB2)[keyof typeof CmdB2];
// function buildCommand(b1: CmdB1, b2: CmdB2, speed: number): Uint8Array {
//   if (speed < 0 || speed > 100) {
//     throw new RangeError('Speed must be between 0 and 100');
//   }
//   const buf = new ArrayBuffer(4);
//   const dv = new DataView(buf);
//   dv.setUint8(0, CmdB0.VehicleControl);
//   dv.setUint8(1, b1);
//   dv.setUint8(2, b2);
//   dv.setUint8(3, speed);
//   return new Uint8Array(buf);
// }
// function u8ArrayToBool(buf: Uint8Array): boolean {
//   if (buf.length === 0) throw new Error('u8ArrayToBool: Empty buffer');
//   return buf[0] !== 0;
// }

// const Controller: FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
//   const [val, setVal] = useState(40);
//   const [logs, setLogs] = useState<string[]>([]);
//   useEffect(() => {
//     if (!lastMessage) return;
//     const data = lastMessage.data;
//     if (data instanceof Blob) {
//       data.arrayBuffer().then((buf) => {
//         const u8 = new Uint8Array(buf);
//         const flag = u8ArrayToBool(u8);
//         setLogs((l) => [...l, flag.toString()]);
//       });
//     }
//   }, [lastMessage]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const raw = parseInt(e.target.value, 10);
//     const v = Number.isNaN(raw) ? 0 : raw;
//     setVal(Math.max(0, Math.min(100, v)));
//   };
//   const handleVehicleMoveForward = () => {
//     const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Forward, val);
//     sendMessage(cmd.buffer);
//   };
//   const handleVechicleStop = () => {
//     const cmd = buildCommand(CmdB1.VehicleStop, CmdB2.Forward, 0);
//     sendMessage(cmd.buffer);
//   };
//   const handleVechicleLeft = () => {
//     const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Left, val);
//     sendMessage(cmd.buffer);
//   };
//   const handleVechicleRight = () => {
//     const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Right, val);
//     sendMessage(cmd.buffer);
//   };
//   return (
//     <div>
//       <div>連線狀態：{ReadyState[readyState]}</div>
//       <div className='flex items-center space-x-2'>
//         <input
//           type='number'
//           value={val}
//           onChange={handleInputChange}
//           min={0}
//           max={100}
//           step={1}
//           style={{
//             width: '4rem',
//             padding: '0.25rem',
//             border: '1px solid #ccc',
//             borderRadius: '0.25rem',
//           }}
//         />
//         <Button onClick={handleVehicleMoveForward}>前進 {val}%</Button>
//         <ul>
//           {logs.map((msg, i) => (
//             <li key={i}>{msg}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Controller;

import { useEffect, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { ReadyState } from 'react-use-websocket';
import { CmdB1, CmdB2 } from '../types/vehicle';
import { buildCommand, u8ArrayToBool } from '../utils/vehicle';
import { useVehicleStatus } from '../hooks/useVehicleStatus';
import { useVehicleLogs } from '../hooks/useVehicleLogs';
import { VehicleHeader } from './VehicleHeader';
import { DirectionControls } from './DirectionControls';
import { SpeedControl } from './SpeedControl';
import { VehicleStatusPanel } from './VehicleStatusPanel';
import { SystemLogs } from './SystemLogs';

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

  const sendCommand = (b1: CmdB1, b2: CmdB2, speedValue: number, direction: string) => {
    if (readyState !== ReadyState.OPEN) return;

    const cmd = buildCommand(b1, b2, speedValue);
    sendMessage(cmd.buffer);
    updateMovementStatus(b1 === CmdB1.VehicleMove, direction);
  };

  const handleStop = () => {
    sendCommand(CmdB1.VehicleMove, CmdB2.Stop, 0, '停止');
  };

  const handleForward = () => {
    sendCommand(CmdB1.VehicleMove, CmdB2.Forward, speed, '前進');
  };

  const handleBackward = () => {
    sendCommand(CmdB1.VehicleMove, CmdB2.Backward, speed, '後退');
  };

  const handleLeft = () => {
    sendCommand(CmdB1.VehicleMove, CmdB2.LeftTurn, speed, '左轉');
  };

  const handleRight = () => {
    sendCommand(CmdB1.VehicleMove, CmdB2.RightTurn, speed, '右轉');
  };

  const handleLeftSpinForward = () => {
    sendCommand(CmdB1.Left, CmdB2.Forward, speed, '左正轉');
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
