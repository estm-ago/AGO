import { useEffect, useState, type FC } from 'react';
import type { WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { Button } from './ui/button';
import { ReadyState } from 'react-use-websocket';

const CmdA0 = {
    DataRecieve: 0x00, 
};
type CmdA0 = (typeof CmdA0)[keyof typeof CmdA0];

const CmdA1 = {
    LeftSpeed: 0x10,
    RightSpeed: 0x11,
    LeftDuty: 0x20,
    RightDuty: 0x21,
};
type CmdA1 = (typeof CmdA1)[keyof typeof CmdA1];

// const CmdA2 = {
// };
// type CmdA2 = (typeof CmdA2)[keyof typeof CmdA2];

function buildCommand(a1: CmdA1, dataval: number): Uint8Array {
    const buf = new ArrayBuffer(4);
    const dv = new DataView(buf);
    dv.setUint8(0, CmdA0.DataRecieve);
    dv.setUint8(1, a1);
    // dv.setUint8(2, a2);
    dv.setUint8(3, dataval);
    return new Uint8Array(buf);
}

function u8ArrayToBool(buf: Uint8Array): boolean {
    if (buf.length === 0) throw new Error('u8ArrayToBool: Empty buffer');
    return buf[0] !== 0;
}

const DataRecieve: FC<WebSocketHook> = ({ sendMessage, lastMessage, readyState }) => {
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
        const v  = Number.isNaN(raw) ? 0 : raw;
        setVal(Math.max(0, Math.min(100, v)));
    };

    const handleLeftDutyRecieve = () => {
        const cmd = buildCommand(CmdA1.LeftDuty, val);
        sendMessage(cmd.buffer);
    }

    const handleRightDutyRecieve = () => {
        const cmd = buildCommand(CmdA1.RightDuty, val);
        sendMessage(cmd.buffer);
    }

    const handleLeftSpeedRecieve = () => {
        const cmd = buildCommand(CmdA1.LeftSpeed, val);
        sendMessage(cmd.buffer);
    }

    const handleRightSpeedRecieve = () => {
        const cmd = buildCommand(CmdA1.RightSpeed, val);
        sendMessage(cmd.buffer);
    }

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
                <Button onClick={handleLeftDutyRecieve}>左馬達Duty</Button>
                <Button onClick={handleRightDutyRecieve}>右馬達Duty</Button>
                <Button onClick={handleLeftSpeedRecieve}>左馬達速度</Button>
                <Button onClick={handleRightSpeedRecieve}>右馬達速度</Button>
                <ul>
                    {logs.map((msg, i) => (
                        <li key={i}>{msg}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DataRecieve;