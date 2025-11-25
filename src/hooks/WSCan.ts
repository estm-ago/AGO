export interface WSCanFrame {
    /** 是否為 29-bit 擴展 ID（true = extended, false = standard 11-bit） */
    extended: boolean;

    /** Remote Transmission Request（true = RTR frame） */
    rtr: boolean;

    /** CAN ID（0x000 ~ 0x7FF or 0x1FFFFFFF） */
    id: number;

    /** 資料內容，實際長度應該等於 dlc（0~8 bytes） */
    data: Uint8Array;

    /** Data Length Code，0 ~ 8 */
    dlc: number;

    /** 是否為錯誤 frame（如 bus error） */
    error?: boolean;
}

const WSCan_Size = 20;

export const WSCan_Baudrate = {
    bps1M:   0x01,
    bps800k: 0x02,
    bps500k: 0x03,
    bps400k: 0x04,
    bps250k: 0x05,
    bps200k: 0x06,
    bps125k: 0x07,
    bps100k: 0x08,
    bps50k:  0x09,
    bps20k:  0x0a,
    bps10k:  0x0b,
    bps5k:   0x0c,
} as const;

export const WSCan = {
    Size: WSCan_Size,
    Baudrate: WSCan_Baudrate,

    dataEncode(frame: WSCanFrame): Uint8Array 
    {
        const packet = new Uint8Array(WSCan_Size);
        packet[0] = 0xAA;
        packet[1] = 0x55;
        packet[2] = 0x01;
        packet[3] = frame.extended ? 0x02 : 0x01;
        packet[4] = frame.rtr ? 0x02 : 0x01;
        const id = frame.id >>> 0; // 確保是無號
        packet[5] = id & 0xff;
        packet[6] = (id >>> 8) & 0xff;
        packet[7] = (id >>> 16) & 0xff;
        packet[8] = (id >>> 24) & 0xff;
        const dlc = Math.min(Math.max(frame.dlc, 0), 8);
        packet[9] = dlc;
        for (let i = 0; i < 8; i++) {
            packet[10 + i] = i < frame.data.length ? frame.data[i]! : 0x00;
        }
        packet[18] = 0x00;
        let sum = 0;
        for (let i = 2; i <= 18; i++) {
            sum += packet[i]!;
        }
        packet[19] = sum & 0xff;
        return packet;
    },

    dataDecode(packet: Uint8Array): WSCanFrame
    {
        if (packet.length !== WSCan_Size) {
            throw new Error(`CAN fixed20 長度錯誤,預期 20, 實際 ${packet.length}`);
        }
        if (packet[0] !== 0xaa || packet[1] !== 0x55) {
            throw new Error("CAN fixed20 header 錯誤");
        }
        const type = packet[2];
        if (type !== 0x01) {
            // 你也可以選擇直接回傳 error，而不是 throw
            throw new Error(`未知 type: 0x${type.toString(16)}`);
        }
        // 校驗碼檢查
        let sum = 0;
        for (let i = 2; i <= 18; i++) {
            sum += packet[i]!;
        }
        const checksum = sum & 0xff;
        if (checksum !== packet[19]) {
            throw new Error(
            `checksum 錯誤，預期 0x${checksum.toString(16)}，實際 0x${packet[19]
                .toString(16)
                .padStart(2, "0")}`,
            );
        }

        // frame type / format
        const frameType = packet[3];
        const frameFormat = packet[4];

        const extended = frameType === 0x02;
        const rtr = frameFormat === 0x02;

        // ID: little-endian
        const id =
            (packet[5]! |
            (packet[6]! << 8) |
            (packet[7]! << 16) |
            (packet[8]! << 24)) >>> 0;

        // DLC
        const dlcRaw = packet[9]!;
        const dlc = Math.min(Math.max(dlcRaw, 0), 8);

        // data
        const data = new Uint8Array(dlc);
        for (let i = 0; i < dlc; i++) {
            data[i] = packet[10 + i]!;
        }

        const frame: WSCanFrame = {
            id,
            extended,
            rtr,
            dlc,
            data,
        };
        return frame;
    }
}
