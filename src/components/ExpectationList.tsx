import { Expectation } from '../types';
import { MethodBadge, StatusBadge } from './ui/Badge';

interface ExpectationListProps {
  expectations: Expectation[];
  selected: Expectation | null;
  onSelect: (e: Expectation) => void;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  width: number;
}

export default function ExpectationList({
  expectations,
  selected,
  onSelect,
  loading,
  error,
  onRefresh,
  width,
}: ExpectationListProps) {
  return (
    <div className="request-list" style={{ width }}>
      <div className="expectation-list-toolbar">
        <span className="expectation-list-count">
          {expectations.length} expectation{expectations.length !== 1 ? 's' : ''}
        </span>
        <button className="btn" onClick={onRefresh} disabled={loading}>
          {loading ? '…' : '⟳ Refresh'}
        </button>
      </div>

      {error && <div className="expectation-error">{error}</div>}

      {!error && expectations.length === 0 && !loading && (
        <div className="empty-state">No expectations configured.</div>
      )}

      {expectations.map((exp, i) => {
        const method = exp.httpRequest.method;
        const path = exp.httpRequest.path ?? '(any path)';
        const status = exp.httpResponse?.statusCode;
        const isSelected = selected === exp;

        return (
          <div
            key={exp.id ?? i}
            className={`request-row ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(exp)}
          >
            {method ? <MethodBadge method={method} /> : <span className="badge badge-any">ANY</span>}
            <span className="row-path" title={path}>{path}</span>
            {status != null && <StatusBadge statusCode={status} />}
          </div>
        );
      })}
    </div>
  );
}
