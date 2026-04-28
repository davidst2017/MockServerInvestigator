/**
 * Fetches the list of active expectations configured in MockServer.
 * Provides a manual refresh and tracks loading state.
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchExpectations } from '../api/mockserver';
import { ConnectionConfig, ConnectionError, Expectation } from '../types';

export function useExpectations(config: ConnectionConfig) {
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpectations(config);
      setExpectations(data);
    } catch (e) {
      setError(e instanceof ConnectionError ? e.message : 'Failed to fetch expectations');
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Fetch on mount and whenever config changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { expectations, loading, error, refresh };
}
