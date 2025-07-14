function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
import { type CmdB0Type, type CmdB1Type, type CmdB2Type, type ReceivedData, CmdB0, CmdB1, CmdB2 } from '@/types';

// 預定義的數據請求命令

function u8ArrayToBool(buf: Uint8Array): boolean {
  if (buf.length === 0) throw new Error('u8ArrayToBool: Empty buffer');
  return buf[0] !== 0;
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString();
}

// 檢查數據是否為錯誤訊息
function isErrorMessage(cmd0: number, rawValue: number): boolean {
  // // 檢查是否為錯誤命令
  // if (cmd0 === CMD_B0_ERROR) {
  //   return true;
  // }

  // 檢查數值是否為異常值（NaN, Infinity, 或超出合理範圍）
  if (isNaN(rawValue) || !isFinite(rawValue)) {
    return true;
  }

  // 檢查速度值是否在合理範圍內（-1000 到 1000）
  if (Math.abs(rawValue) > 1000) {
  // if (cmd0 === CMD_B0_DATA && Math.abs(rawValue) > 1000) {
    return true;
  }

  return false;
}

// 驗證數據是否合理
function isValidData(cmd0: number, cmd1: number, rawValue: number): boolean {
  if (cmd0 === CmdB0.DataControl) {
    switch (cmd1) {
      case CmdB1.LeftDuty:
      case CmdB1.RightDuty:
        // 功率值應該在 0-100 範圍內
        return rawValue >= 0 && rawValue <= 100;
      case CmdB1.LeftSpeed:
      case CmdB1.RightSpeed:
        // 速度值應該在合理範圍內（比如 -500 到 500）
        return rawValue >= -500 && rawValue <= 500;
      default:
        return true;
    }
  }
  return true;
}

// 解析從ESP32接收到的數據
function parseReceivedData(buffer: ArrayBuffer): ReceivedData | null {
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
  const rawHex = uint8ArrayToHex(u8Array);
  // 檢查是否為錯誤訊息
  const isError = isErrorMessage(cmd0, rawValue);
  // let errorCode: ErrorType;
  // if (isError) {
  //   if (cmd0 === CMD_B0_ERROR) {
  //     errorCode = cmd1;
  //   }
  //   console.warn('⚠️ 檢測到錯誤訊息:', {
  //     cmd0: cmd0.toString(16),
  //     cmd1: cmd1.toString(16),
  //     rawValue,
  //     errorCode,
  //     rawHex,
  //   });
  // }
  // 檢查數據有效性
  if (!isError && !isValidData(cmd0, cmd1, rawValue)) {
    console.warn('⚠️ 數據值超出合理範圍，標記為錯誤:', {
      cmd0: cmd0.toString(16),
      cmd1: cmd1.toString(16),
      rawValue,
      rawHex,
    });
    return null; // 直接排除無效數據
  }

  // const description = getDataDescription(cmd0, cmd1, isError, errorCode);
  // Extract cmd2mode and cmd2motion if available, otherwise set as undefined
  const description = getDataDescription(
    cmd0 as CmdB0Type,
    cmd1 as CmdB1Type,
    cmd2mode as CmdB2Type<'Mode'>,
    cmd2motion as CmdB2Type<'Motion'>
  );
  let parsedValue: number | string = rawValue;

  // 只有非錯誤數據才進行正常解析
  // if (!isError && cmd0 === CMD_B0_DATA) {
  if (!isError) {
    switch (cmd1) {
      case CmdB1.LeftDuty:
      case CmdB1.RightDuty:
        // 功率值通常是0-100的整數
        parsedValue = Math.round(rawValue);
        break;
      case CmdB1.LeftSpeed:
      case CmdB1.RightSpeed:
        // 速度值保持float精度
        parsedValue = parseFloat(rawValue.toFixed(2));
        break;
      default:
        parsedValue = rawValue;
    }
  }
  // else if (isError) {
  //   parsedValue = `錯誤: ${getErrorDescription(errorCode)}`;
  // }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: formatTimestamp(),
    cmd0,
    cmd1,
    rawValue,
    parsedValue,
    description,
    rawHex,
    isError,
    // errorCode,
  };
}

// 根據命令獲取描述
function getDataDescription(
  cmd0: CmdB0Type,
  cmd1: CmdB1Type,
  cmd2mode: CmdB2Type<'Mode'>,
  cmd2motion: CmdB2Type<'Motion'>,
  // isError: boolean = false,
  // errorCode?: number,
): string {
  // if (isError) {
  //   if (cmd0 === CMD_B0_ERROR) {
  //     return `系統錯誤 (${getErrorDescription(errorCode)})`;
  //   }
  //   return '數據錯誤';
  // }

  if (cmd0 === CmdB0.DataControl) {
    switch (cmd1) {
      case CmdB1.LeftSpeed:
        return '左馬達速度';
      case CmdB1.RightSpeed:
        return '右馬達速度';
      case CmdB1.LeftDuty:
        return '左馬達功率';
      case CmdB1.RightDuty:
        return '右馬達功率';
      default:
        return '未知數據類型';
    }
  } else if (cmd0 === CmdB0.VehicleControl) {
    switch (cmd2mode || cmd2motion) {
      case CmdB2.Motion.Stop:
        return '車輛停止';
      case CmdB2.Motion.Forward:
        return '車輛移動';
      case CmdB2.Motion.Left:
        return '車輛左轉';
      case CmdB2.Motion.Right:
        return '車輛右轉';
      case CmdB2.Mode.Free:
        return '自由模式';
      case CmdB2.Mode.Track:
        return '循跡模式';
      default:
        return '未知控制命令';
    }
  }

  return '未知命令';
}

// 獲取錯誤描述
// function getErrorDescription(errorCode?: number): string {
//   if (!errorCode) return '未知錯誤';

//   switch (errorCode) {
//     case ERROR_CODES.SENSOR_FAILURE:
//       return '感測器故障';
//     case ERROR_CODES.MOTOR_FAILURE:
//       return '馬達故障';
//     case ERROR_CODES.COMMUNICATION_ERROR:
//       return '通訊錯誤';
//     case ERROR_CODES.POWER_LOW:
//       return '電力不足';
//     case ERROR_CODES.OVERHEATING:
//       return '過熱保護';
//     case ERROR_CODES.UNKNOWN_COMMAND:
//       return '未知命令';
//     default:
//       return `錯誤代碼: ${errorCode}`;
//   }
// }

// 將Uint8Array轉換為16進制字符串
function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export { concatUint8Arrays, uint8ArrayToHex, parseReceivedData, formatTimestamp, u8ArrayToBool };
