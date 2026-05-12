import { useMemo, useState } from 'react';
import { LogEntry } from '../types';

const DEFAULT_PAGE_SIZE = 200;

export function useLogPaging(logs: LogEntry[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const total = logs.length;
  const hasMore = visibleCount < total;

  const visibleLogs = useMemo(() => logs.slice(0, visibleCount), [logs, visibleCount]);

  function loadMore() {
    setVisibleCount((count) => Math.min(count + pageSize, total));
  }

  function showAll() {
    setVisibleCount(total);
  }

  function showLess() {
    setVisibleCount(pageSize);
  }

  return {
    pageSize,
    total,
    visibleCount,
    visibleLogs,
    hasMore,
    loadMore,
    showAll,
    showLess,
  };
}
