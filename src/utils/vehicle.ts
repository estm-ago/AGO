import { CmdB0, CmdB1, CmdB2 } from '../types/vehicle';
import {
  CMD_B0_DATA,
  CMD_B0_VEHICLE_CONTROL,
  CMD_B1_LEFT_SPEED,
  CMD_B1_RIGHT_SPEED,
  CMD_B1_LEFT_DUTY,
  CMD_B1_RIGHT_DUTY,
  CMD_B1_VEHICLE_STOP,
  CMD_B1_VEHICLE_MOVE,
  CMD_B1_LEFT_STOP,
  CMD_B1_LEFT_SPIN,
  CMD_B1_RIGHT_STOP,
  CMD_B1_RIGHT_SPIN,
  type ReceivedData,
} from '../types/vehicle';

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

// 解析從ESP32接收到的數據
export function parseReceivedData(buffer: ArrayBuffer): ReceivedData | null {
  const u8Array = new Uint8Array(buffer);
  
  if (u8Array.length < 6) {
    console.warn('收到的數據長度不足:', u8Array.length);
    return null;
  }

  const cmd0 = u8Array[0];
  const cmd1 = u8Array[1];
  
  // 解析後面4個字節作為float32
  const dataView = new DataView(buffer, 2, 4);
  const rawValue = dataView.getFloat32(0, false); // false = big-endian
  
  // 生成16進制字符串表示
  const rawHex = Array.from(u8Array)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join('');

  const description = getDataDescription(cmd0, cmd1);
  let parsedValue: number | string = rawValue;

  // 根據命令類型調整解析方式
  if (cmd0 === CMD_B0_DATA) {
    switch (cmd1) {
      case CMD_B1_LEFT_DUTY:
      case CMD_B1_RIGHT_DUTY:
        // 功率值通常是0-100的整數
        parsedValue = Math.round(rawValue);
        break;
      case CMD_B1_LEFT_SPEED:
      case CMD_B1_RIGHT_SPEED:
        // 速度值保持float精度
        parsedValue = parseFloat(rawValue.toFixed(2));
        break;
      default:
        parsedValue = rawValue;
    }
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: formatTimestamp(),
    cmd0,
    cmd1,
    rawValue,
    parsedValue,
    description,
    rawHex,
  };
}

// 根據命令獲取描述
function getDataDescription(cmd0: number, cmd1: number): string {
  if (cmd0 === CMD_B0_DATA) {
    switch (cmd1) {
      case CMD_B1_LEFT_SPEED:
        return '左馬達速度';
      case CMD_B1_RIGHT_SPEED:
        return '右馬達速度';
      case CMD_B1_LEFT_DUTY:
        return '左馬達功率';
      case CMD_B1_RIGHT_DUTY:
        return '右馬達功率';
      default:
        return '未知數據類型';
    }
  } else if (cmd0 === CMD_B0_VEHICLE_CONTROL) {
    switch (cmd1) {
      case CMD_B1_VEHICLE_STOP:
        return '車輛停止';
      case CMD_B1_VEHICLE_MOVE:
        return '車輛移動';
      case CMD_B1_LEFT_STOP:
        return '左馬達停止';
      case CMD_B1_LEFT_SPIN:
        return '左馬達旋轉';
      case CMD_B1_RIGHT_STOP:
        return '右馬達停止';
      case CMD_B1_RIGHT_SPIN:
        return '右馬達旋轉';
      default:
        return '未知控制命令';
    }
  }
  
  return '未知命令';
}

// 將Uint8Array轉換為16進制字符串
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}
