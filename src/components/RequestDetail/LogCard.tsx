import { LogEntry } from '../../types';

function logCardClass(message: string): string {
  if (/no.match|not.matched|EXPECTATION_NOT_MATCHED/i.test(message))
    return 'log-card log-card-fail';
  if (/expectation.matched|EXPECTATION_MATCHED/i.test(message)) return 'log-card log-card-ok';
  return 'log-card log-card-neutral';
}

interface LogCardProps {
  log: LogEntry;
}

export function LogCard({ log }: LogCardProps) {
  return (
    <div className={logCardClass(log.message)}>
      <div className="log-card-header">
        <span className="log-time">{log.timestamp}</span>
      </div>
      <pre className="log-message">{log.message}</pre>
    </div>
  );
}
