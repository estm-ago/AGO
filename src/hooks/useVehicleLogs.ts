import type { LogEntry } from '@/types';
import { formatTimestamp } from '@/utils';
import { useState, useCallback } from 'react';

export function useVehicleLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, success: boolean) => {
    const newLog: LogEntry = {
      timestamp: formatTimestamp(),
      message,
      success,
    };
    setLogs((prev) => [...prev.slice(-19), newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
