import { LogEntry } from '../../types';
import { LogCard } from './LogCard';

interface LogsTabProps {
  logs: LogEntry[];
}

export function LogsTab({ logs }: LogsTabProps) {
  if (logs.length === 0) {
    return <div className="empty-state">No logs for this request.</div>;
  }

  return (
    <div className="tab-content">
      {logs.map((log, i) => (
        <LogCard key={i} log={log} />
      ))}
    </div>
  );
}
