import { LogEntry } from '../../types';
import { useLogPaging } from '../../hooks/useLogPaging';
import { LogCard } from './LogCard';

interface LogsTabProps {
  logs: LogEntry[];
}

export function LogsTab({ logs }: LogsTabProps) {
  const { pageSize, visibleLogs, visibleCount, total, hasMore, loadMore, showAll, showLess } =
    useLogPaging(logs);

  if (logs.length === 0) {
    return <div className="empty-state">No logs for this request.</div>;
  }

  return (
    <div className="tab-content">
      <section className="detail-section">
        <h3 className="detail-heading">Match Logs</h3>
        <div className="detail-label">
          Showing {visibleCount} of {total} entries
        </div>
        <div className="expectation-editor-actions">
          {hasMore && (
            <button className="btn" onClick={loadMore}>
              Load {pageSize} more
            </button>
          )}
          {hasMore && (
            <button className="btn" onClick={showAll}>
              Show all
            </button>
          )}
          {!hasMore && total > pageSize && (
            <button className="btn" onClick={showLess}>
              Collapse to first {pageSize}
            </button>
          )}
        </div>
      </section>

      {visibleLogs.map((log, i) => (
        <LogCard key={i} log={log} />
      ))}
    </div>
  );
}
