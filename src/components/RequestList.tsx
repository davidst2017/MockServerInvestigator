import { RequestResponseEntry } from '../types';
import { getSoapAction } from '../utils';
import { MatchBadge, MethodBadge } from './ui/Badge';

interface RequestListProps {
  entries: RequestResponseEntry[];
  selectedEntry: RequestResponseEntry | null;
  onSelect: (entry: RequestResponseEntry) => void;
  onClear: () => void;
  width: number;
  filterActive: boolean;
  hiddenCount: number;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return (
      d.toLocaleTimeString('en-GB', { hour12: false }) +
      '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    );
  } catch {
    return ts;
  }
}

export default function RequestList({
  entries,
  selectedEntry,
  onSelect,
  onClear,
  width,
  filterActive,
  hiddenCount,
}: RequestListProps) {
  if (entries.length === 0) {
    return (
      <div className="request-list" style={{ width }}>
        <div className="expectation-list-toolbar">
          <span className="expectation-list-count">0 requests</span>
          <button className="btn btn-danger" onClick={onClear}>
            ✕ Clear
          </button>
        </div>
        {filterActive && <div className="filter-banner">Filter active — {hiddenCount} hidden</div>}
        <div className="empty-state">No matching requests.</div>
      </div>
    );
  }

  return (
    <div className="request-list" style={{ width }}>
      <div className="expectation-list-toolbar">
        <span className="expectation-list-count">
          {entries.length} request{entries.length !== 1 ? 's' : ''}
        </span>
        <button className="btn btn-danger" onClick={onClear}>
          ✕ Clear
        </button>
      </div>
      {filterActive && (
        <div className="filter-banner">
          {entries.length} shown — {hiddenCount} hidden
        </div>
      )}
      {entries.map((entry, i) => {
        const method = entry.httpRequest.method ?? '';
        const status = entry.httpResponse?.statusCode;
        const matched = status != null && status !== 404;
        const soapAction = getSoapAction(entry.httpRequest);
        const isSelected =
          selectedEntry !== null &&
          selectedEntry.httpRequest.method === entry.httpRequest.method &&
          selectedEntry.httpRequest.path === entry.httpRequest.path &&
          selectedEntry.timestamp === entry.timestamp;

        return (
          <div
            key={i}
            className={`request-row ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(entry)}
          >
            <span className="row-time">{formatTime(entry.timestamp)}</span>
            <MethodBadge method={method} />
            <span className="row-path-group">
              <span className="row-path" title={entry.httpRequest.path}>
                {entry.httpRequest.path}
              </span>
              {soapAction && (
                <span className="row-soap-action" title={soapAction}>
                  {soapAction}
                </span>
              )}
            </span>
            <span className="row-status">{status ?? '—'}</span>
            <MatchBadge matched={matched} />
          </div>
        );
      })}
    </div>
  );
}
