import { useEffect, useState, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { Button } from './ui/button';
import { ReadyState } from 'react-use-websocket';
const CmdB0 = {
  VehicleControl: 0x10,
};
type CmdB0 = (typeof CmdB0)[keyof typeof CmdB0];
const CmdB1 = {
  VehicleStop: 0x00,
  VehicleMove: 0x01,
  LeftStop: 0x40,
  LeftSpin: 0x41,
  RightStop: 0x42,
  RightSpin: 0x43,
};
type CmdB1 = (typeof CmdB1)[keyof typeof CmdB1];
const CmdB2 = {
  Forward: 0x00,
  Backward: 0x01,
  Left: 0x02,
  Right: 0x03,
};
type CmdB2 = (typeof CmdB2)[keyof typeof CmdB2];
function buildCommand(b1: CmdB1, b2: CmdB2, speed: number): Uint8Array {
  if (speed < 0 || speed > 100) {
    throw new RangeError('Speed must be between 0 and 100');
  }
  const buf = new ArrayBuffer(4);
  const dv = new DataView(buf);
  dv.setUint8(0, CmdB0.VehicleControl);
  dv.setUint8(1, b1);
  dv.setUint8(2, b2);
  dv.setUint8(3, speed);
  return new Uint8Array(buf);
}
function u8ArrayToBool(buf: Uint8Array): boolean {
  if (buf.length === 0) throw new Error('u8ArrayToBool: Empty buffer');
  return buf[0] !== 0;
}

const Controller: FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
  const [val, setVal] = useState(40);
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage.data;
    if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        const u8 = new Uint8Array(buf);
        const flag = u8ArrayToBool(u8);
        setLogs((l) => [...l, flag.toString()]);
      });
    }
  }, [lastMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const v = Number.isNaN(raw) ? 0 : raw;
    setVal(Math.max(0, Math.min(100, v)));
  };
  const handleVehicleMoveForward = () => {
    const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Forward, val);
    sendMessage(cmd.buffer);
  };
  const handleVechicleStop = () => {
    const cmd = buildCommand(CmdB1.VehicleStop, CmdB2.Forward, 0);
    sendMessage(cmd.buffer);
  };
  const handleVechicleLeft = () => {
    const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Left, val);
    sendMessage(cmd.buffer);
  };
  const handleVechicleRight = () => {
    const cmd = buildCommand(CmdB1.VehicleMove, CmdB2.Right, val);
    sendMessage(cmd.buffer);
  };
  return (
    <div>
      <div>連線狀態：{ReadyState[readyState]}</div>
      <div className='flex items-center space-x-2'>
        <input
          type='number'
          value={val}
          onChange={handleInputChange}
          min={0}
          max={100}
          step={1}
          style={{
            width: '4rem',
            padding: '0.25rem',
            border: '1px solid #ccc',
            borderRadius: '0.25rem',
          }}
        />
        <Button onClick={handleVehicleMoveForward}>前進 {val}%</Button>
        <ul>
          {logs.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Controller;
