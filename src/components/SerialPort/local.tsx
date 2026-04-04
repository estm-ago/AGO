import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ActionButton } from "@/components/ui/button";
import { InputN } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LocalCANConsole = () =>
{
  const COMMAND_OPTIONS = [
    { id:"140", value: "FF 00" },
    { id:"140", value: "FF 01" },
    { id:"140", value: "02 00 41 F0 00 00" },
    { id:"140", value: "02 00 42 8C 00 00" },
  ];

  // ports：可用埠清單
  // list of available ports
  const [ports, setPorts] = useState<string[]>([]);
  // selectedPort：目前選中的埠 / currently selected port
  const [selectedPort, setSelectPort] = useState(
    () => localStorage.getItem("selectedPort") || ""
  );
  // isOpen：埠是否已開啟
  // whether the port is open
  const [isOpen, setIsOpen] = useState(false);
  // response：後端命令回傳訊息
  // backend command response message
  const [response, setResponse] = useState(
    () => sessionStorage.getItem("OCResponse") || ""
  );
  const [input_adr, setInputAdr] = useState<string>(COMMAND_OPTIONS[0].id);
  const [input_msg, setInputMsg] = useState<string>(COMMAND_OPTIONS[0].value);
  
  // 同步 selectedPort 到 localStorage
  // sync selectedPort to localStorage
  useEffect(() => {
    localStorage.setItem("selectedPort", selectedPort);
  }, [selectedPort]);

  // 同步 response 到 sessionStorage
  // sync response to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("OCResponse", response);
  }, [response]);

  // 初始化時載入可用埠
  // fetch available ports on mount
  useEffect(() => {
    async function fetchPorts() {
      try {
        const list = await invoke<string[]>("wscan_available");
        setPorts(list);
        const currentSelected = localStorage.getItem("selectedPort") || "";
        if (!currentSelected || !list.includes(currentSelected)) {
          setSelectPort(list.length > 0 ? list[0] : "");
        } else {
          setSelectPort(currentSelected);
        }
      } catch (error) {
        console.error("取得可用埠失敗:", error);
      }
    }
    fetchPorts();
  }, []);

  // response 變化時檢查埠開啟狀態
  // check port status when response changes
  useEffect(() => {
    async function checkPort() {
      const result = await invoke<boolean>("wscan_check_open");
      setIsOpen(result);
    }
    checkPort();
  }, [response]);

  // openPort：呼叫後端開埠
  // call backend to open port
  const openPort = async () => {
    const result = await invoke("wscan_open", { portName: selectedPort });
    const message = `${result}`;
    setResponse(message);
    setIsOpen(true);
  };

  // closePort：呼叫後端關埠
  // call backend to close port
  const closePort = async () => {
    const result = await invoke("wscan_close");
    const message = `${result}`;
    setResponse(message);
    setIsOpen(false);
  };

  const exportCSV = async () => {
    const result = await invoke("wscan_export");
    const message = `${result}`;
    setResponse(message);
  };

  const handleSend = async () => {
    try {
      // 呼叫 Rust 後端指令
      const result = await invoke("wscan_send", { id: input_adr, data: input_msg });
      // 將成功訊息顯示在畫面上
      setResponse(`${result}`);
    } catch(err: any) {
      // 若後端回傳 Err，捕捉並顯示錯誤訊息
      setResponse(`送出失敗: ${err?.message ?? String(err)}`);
    }
  };
  
  // 元件呈現
  // component render
  return (
    <div className="flex flex-col space-y-2 py-2 text-xl items-center min-w-[450px]">
      <h2> Local USB-CAN 串口測試 </h2>

      {/* 下拉選單：選擇埠 / dropdown for selecting port */}
      <div className="flex items-center space-x-2">
        <Select 
          value={selectedPort} 
          onValueChange={(val) => {
            setSelectPort(val);
          }}
        >
          {/* 觸發按鈕 */}
          <SelectTrigger className="w-30 border-2 border-black rounded px-1 text-base">
            <SelectValue placeholder="請選擇" />
          </SelectTrigger>
          
          {/* 展開內容 */}
          <SelectContent>
            {ports.map((opt, index) => (
              <SelectItem key={index} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* 根據 isOpen 顯示 Open/Close 按鈕 / toggle Open/Close button based on isOpen */}
        {isOpen ? (
          <ActionButton className="w-20 text-lg h-9" color="red" onClick={closePort}> Close </ActionButton>
        ) : (
          <ActionButton className="w-20 text-lg h-9" color="green" onClick={openPort}> Open </ActionButton>
        )}
        <ActionButton className="w-15 text-lg h-9" color="blue" onClick={exportCSV}> CSV </ActionButton>
      </div>

      <div className="flex items-center space-x-2">
        {/* 下拉選單：用來快速套用常用指令 */}
        <Select 
          value={input_msg} 
          onValueChange={(val) => {
            setInputMsg(val);
            // 如果選了清單內的指令 把ID自動帶入
            const matchedCmd = COMMAND_OPTIONS.find(opt => opt.value === val);
            if (matchedCmd) {
              setInputAdr(matchedCmd.id);
            }
          }}
        >
          {/* 觸發按鈕 */}
          <SelectTrigger className="w-70 border-2 border-black rounded px-1 text-base">
            <SelectValue placeholder="請選擇" />
          </SelectTrigger>
          
          {/* 展開內容 */}
          <SelectContent>
            {/* 顯示自訂 */}
            {!COMMAND_OPTIONS.find(opt => opt.value === input_msg) && (
              <SelectItem value={input_msg}>-- Customize --</SelectItem>
            )}
            {/* 渲染指令 */}
            {COMMAND_OPTIONS.map((opt, index) => (
              <SelectItem key={index} value={opt.value}>
                [{opt.id}] {opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ActionButton className="w-15 text-lg h-9" onClick={handleSend} disabled={!isOpen}> 送出 </ActionButton>
      </div>

      {/* 文字輸入框：讓你可以微調下拉選單選出來的資料 */}
      <div className="space-x-2">
        <label className="text-lg">
          id:
          <InputN className="w-12 ml-1 h-9" value={input_adr} onChange={(e) => setInputAdr(e.target.value)}/>
        </label>
        <label className="text-lg">
          datas:
          <InputN className="w-70 ml-1 h-9" value={input_msg} onChange={(e) => setInputMsg(e.target.value)}/>
        </label>
      </div>
      
      {/* 顯示指令回應訊息 / display command response */}
      <div className="w-4/5">
        <label className="text-lg">收發紀錄：
          <textarea
            // 加入了寬度、邊框、一點灰底(提示唯讀)，以及 resize-y 允許垂直拉伸
            className="w-full text-2xl min-h-[4em] min-w-96 border-2 border-black rounded p-2 focus:outline-none resize-y"
            value={response || ""}
            readOnly
          />
        </label>
      </div>
    </div>
  );
};

export default LocalCANConsole;
