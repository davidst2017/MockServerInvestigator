/**
 * Fetches MockServer match logs for the currently selected request.
 * Re-fetches whenever the selected entry or config changes.
 * Uses an AbortController so an in-flight request is cancelled if the
 * selected entry changes before the response arrives.
 * Returns an empty array while no entry is selected.
 */
import { useEffect, useState } from 'react';
import { fetchLogs } from '../api/mockserver';
import { ConnectionConfig, LogEntry, RequestResponseEntry } from '../types';

export function useRequestLogs(config: ConnectionConfig, selectedEntry: RequestResponseEntry | null): LogEntry[] {
  const [logs, setLogs] = useState<LogEntry[]>([]);  
  useEffect(() => {
    console.log('[useRequestLogs] effect triggered', {
      selectedEntry: selectedEntry
        ? `${selectedEntry.httpRequest.method} ${selectedEntry.httpRequest.path}`
        : null,
      config,
    });

    if (!selectedEntry) {
      return;
    }
    const controller = new AbortController();
    console.log('[useRequestLogs] fetching logs for', selectedEntry.httpRequest.method, selectedEntry.httpRequest.path);
    fetchLogs(config, {
      method: selectedEntry.httpRequest.method,
      path: selectedEntry.httpRequest.path,
    })
      .then((data) => {
        console.log('[useRequestLogs] fetch success, count:', data.length);
        if (!controller.signal.aborted) setLogs(data);
      })
      .catch((err) => {
        console.warn('[useRequestLogs] fetch error:', err);
        if (!controller.signal.aborted) setLogs([]);
      });
    return () => {
      console.log('[useRequestLogs] cleanup / abort');
      controller.abort();
    };
  }, [selectedEntry, config]);

  // Return empty array when nothing is selected rather than calling setLogs([])
  // synchronously in the effect (which triggers cascading renders).
  return selectedEntry ? logs : [];
}
