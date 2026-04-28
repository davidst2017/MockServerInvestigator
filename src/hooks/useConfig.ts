/**
 * Manages the MockServer connection config (host + port).
 * Persists to localStorage so settings survive page reloads.
 * Returns the current config and a change handler that keeps
 * state and storage in sync.
 */
import { useState } from 'react';
import { ConnectionConfig } from '../types';

const STORAGE_KEY = 'mockserver-investigator-config';

function loadConfig(): ConnectionConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ConnectionConfig;
  } catch {
    // ignore
  }
  return { host: 'localhost', port: '6081' };
}

export function useConfig() {
  const [config, setConfig] = useState<ConnectionConfig>(loadConfig);

  function handleConfigChange(field: keyof ConnectionConfig, value: string) {
    const next = { ...config, [field]: value };
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return { config, handleConfigChange };
}
