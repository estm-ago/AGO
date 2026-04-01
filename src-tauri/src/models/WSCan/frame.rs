pub struct WSCanFrame {
    /// 是否為 29-bit 擴展 ID（true = extended, false = standard 11-bit）
    pub extended: bool,

    /// Remote Transmission Request（true = RTR frame）
    pub rtr: bool,

    /// CAN ID（0x000 ~ 0x7FF or 0x1FFFFFFF）
    pub id: u32,

    /// 資料內容，實際長度應該等於 dlc（0~8 bytes）
    pub data: Vec<u8>,

    /// Data Length Code，0 ~ 8
    pub dlc: u8,

    /// 是否為錯誤 frame（如 bus error）
    pub error: bool,
}
impl WSCanFrame {
    /// 定義 CAN 固定封包長度
    pub const SIZE: usize = 20;

    /// 等同於 TypeScript 的 dataEncode
    pub fn encode(&self) -> Vec<u8> {
        let mut packet = vec![0u8; Self::SIZE];
        
        packet[0] = 0xAA;
        packet[1] = 0x55;
        packet[2] = 0x01;
        packet[3] = if self.extended { 0x02 } else { 0x01 };
        packet[4] = if self.rtr { 0x02 } else { 0x01 };

        // 處理 ID (Little-endian 轉換)
        let id_bytes = self.id.to_le_bytes();
        packet[5..9].copy_from_slice(&id_bytes);

        // 處理 DLC (限制在 0~8 之間)
        let dlc = self.dlc.clamp(0, 8);
        packet[9] = dlc;

        // 處理 Data
        for i in 0..8 {
            if i < self.data.len() && i < dlc as usize {
                packet[10 + i] = self.data[i];
            } else {
                packet[10 + i] = 0x00;
            }
        }

        packet[18] = 0x00;

        // 計算 Checksum (從 index 2 加到 18)
        let mut sum: u32 = 0;
        for i in 2..=18 {
            sum += packet[i] as u32;
        }
        packet[19] = (sum & 0xFF) as u8;

        packet
    }

    /// 等同於 TypeScript 的 dataDecode
    pub fn decode(packet: &[u8]) -> Result<Self, String> {
        if packet.len() != Self::SIZE {
            return Err(format!("CAN fixed20 長度錯誤,預期 {}, 實際 {}", Self::SIZE, packet.len()));
        }
        if packet[0] != 0xAA || packet[1] != 0x55 {
            return Err("CAN fixed20 header 錯誤".to_string());
        }
        if packet[2] != 0x01 {
            return Err(format!("未知 type: 0x{:02X}", packet[2]));
        }

        // 驗證 Checksum
        let mut sum: u32 = 0;
        for i in 2..=18 {
            sum += packet[i] as u32;
        }
        let checksum = (sum & 0xFF) as u8;
        
        if checksum != packet[19] {
            return Err(format!("checksum 錯誤，預期 0x{:02X}，實際 0x{:02X}", checksum, packet[19]));
        }

        let extended = packet[3] == 0x02;
        let rtr = packet[4] == 0x02;

        // 還原 ID (從 Little-endian 轉回 u32)
        let mut id_bytes = [0u8; 4];
        id_bytes.copy_from_slice(&packet[5..9]);
        let id = u32::from_le_bytes(id_bytes);

        // 還原 DLC
        let dlc = packet[9].clamp(0, 8);

        // 還原 Data
        let mut data = vec![0u8; dlc as usize];
        data.copy_from_slice(&packet[10..(10 + dlc as usize)]);

        Ok(WSCanFrame {
            id,
            extended,
            rtr,
            dlc,
            data,
            error: false, // TS 版本中 decode 沒有處理 error 欄位，此處給預設值
        })
    }
}
