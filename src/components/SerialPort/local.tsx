import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const UartPortOCComp = () => {
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

    // 元件呈現
    // component render
    return (
        <div className="flex flex-col items-center space-y-4 py-4 text-xl">
            <h2>Local USB-CAN 串口測試</h2>
            {/* 下拉選單：選擇埠 / dropdown for selecting port */}
            <select
                value={selectedPort}
                onChange={(e) => setSelectPort(e.target.value)}
                className="open_close_port-input-defalt"
            >
                {ports.map((p) => (
                    <option key={p} value={p}>
                        {p}
                    </option>
                ))}
            </select>
            {/* 根據 isOpen 顯示 Open/Close 按鈕 / toggle Open/Close button based on isOpen */}
            {isOpen ? (
                <button
                    className="border-2 border-red-500 text-red-500 rounded px-1 hover:bg-red-50 transition-colors"
                    onClick={closePort}
                > Close </button>
            ) : (
                <button
                    className="border-2 border-green-500 text-green-500 rounded px-1 hover:bg-green-50 transition-colors"
                    onClick={openPort}
                > Open </button>
            )}
            {/* 顯示指令回應訊息 / display command response */}
            <div>
                <pre className="text-2xl min-h-[4em]">
                    {response || ""}
                </pre>
            </div>
        </div>
    );
};

export default UartPortOCComp;
