/// <reference types="wicg-file-system-access" />
import type { VehicleData, MotorData } from "@/types";

export class VehicleDataParser
{
  public tick: number = 0;
  public size: number;
  public buffer: (VehicleData | null)[];
  constructor(seconds: number, ratePerSecond: number)
  {
    this.size = seconds * ratePerSecond;
    // 預分配空間，提升效能
    this.buffer = new Array(this.size).fill(null);
  }

  push(data: VehicleData)
  {
    const index = data.tick % this.size; 
    // 直接放入對應位置，O(1)
    this.buffer[index] = data;
  }

  get(tick: number): VehicleData | null
  {
    const index = tick % this.size;
    const data = this.buffer[index];
    
    // 檢查提取的是否為正確的 tick (防止環狀覆蓋錯誤)
    return data && data.tick === tick ? data : null;
  }

  private exportToText(): string {
    return this.buffer
    .filter((data): data is VehicleData => data !== null) // 排除尚未填入資料的區塊
    .sort((a, b) => a.tick - b.tick) // 確保 Tick 排序正確
    .map(data => {
      const L = data.motorLeft;
      return `${data.tick} ${L.rpm_ref} ${L.rpm_fbk}`;
    })
    .join('\n');
  }

  private fallbackDownload(filename: string) {
    const content = this.exportToText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    alert("您的瀏覽器不支援自選位置，已自動下載至預設資料夾。");
  }

  async saveAsTxt(suggestedName: string = "motor_log.txt") {
    // 檢查瀏覽器是否支援此 API
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(this.exportToText());
        await writable.close();
        
        console.log("檔案儲存成功！");
      } catch (err) {
        // 使用者取消選擇或發生錯誤
        console.error("儲存被取消或失敗", err);
      }
    } else {
      // 備案：如果瀏覽器不支援 (例如 Firefox)，回退到傳統下載模式
      this.fallbackDownload(suggestedName);
    }
  }
}
