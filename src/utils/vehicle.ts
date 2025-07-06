import { CmdB0, CmdB1, CmdB2 } from '../types/vehicle';

export function buildCommand(b1: CmdB1, b2: CmdB2, speed: number): Uint8Array {
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

export function u8ArrayToBool(buf: Uint8Array): boolean {
  if (buf.length === 0) throw new Error('u8ArrayToBool: Empty buffer');
  return buf[0] !== 0;
}

export function formatTimestamp(): string {
  return new Date().toLocaleTimeString();
}
