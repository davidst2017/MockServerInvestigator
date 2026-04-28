/**
 * Polls MockServer for recorded request/response entries every 2 seconds.
 * Auto-refresh can be toggled on/off. Re-runs the interval whenever
 * config changes. Also exposes a manual refresh and a clear action
 * that resets the server state and local entries.
 *
 * NOTE: the endless fetches you see in devtools are the interval
 * working as intended — one request every 2s while autoRefresh is ON.
 * If "effect triggered" fires rapidly it means config is changing
 * reference on every render (object identity issue).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { clearAll, fetchRequestResponses } from '../api/mockserver';
import { ConnectionConfig, ConnectionError, RequestResponseEntry } from '../types';

const REFRESH_INTERVAL_MS = 2000;

export function useRequestPolling(config: ConnectionConfig) {
  const [allEntries, setAllEntries] = useState<RequestResponseEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const entries = await fetchRequestResponses(config);
      setAllEntries(entries.slice().reverse());
      setConnected(true);
    } catch (e) {
      if (e instanceof ConnectionError) setConnected(false);
    }
  }, [config]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    refresh();
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config, autoRefresh, refresh]);

  function handleClear() {
    clearAll(config).catch(() => null);
    setAllEntries([]);
  }

  return {
    allEntries,
    connected,
    autoRefresh,
    toggleAutoRefresh: () => setAutoRefresh((v) => !v),
    refresh,
    handleClear,
  };
}
