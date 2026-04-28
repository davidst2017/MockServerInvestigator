import { Expectation } from '../types';
import { getSoapAction } from '../utils';
import { MethodBadge, StatusBadge } from './ui/Badge';

interface ExpectationListProps {
  expectations: Expectation[];
  selected: Expectation | null;
  onSelect: (e: Expectation) => void;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClear: () => void;
  width: number;
  filterActive: boolean;
  hiddenCount: number;
}

export default function ExpectationList({
  expectations,
  selected,
  onSelect,
  loading,
  error,
  onRefresh,
  onClear,
  width,
  filterActive,
  hiddenCount,
}: ExpectationListProps) {
  return (
    <div className="request-list" style={{ width }}>
      <div className="expectation-list-toolbar">
        <span className="expectation-list-count">
          {expectations.length} expectation{expectations.length !== 1 ? 's' : ''}
        </span>
        <button className="btn" onClick={onRefresh} disabled={loading}>
          {loading ? '\u2026' : '\u27f3 Refresh'}
        </button>
        <button className="btn btn-danger" onClick={onClear} disabled={loading}>
          Clear
        </button>
      </div>

      {filterActive && (
        <div className="filter-banner">
          {expectations.length} shown \u2014 {hiddenCount} hidden
        </div>
      )}

      {error && <div className="expectation-error">{error}</div>}

      {!error && expectations.length === 0 && !loading && (
        <div className="empty-state">No expectations configured.</div>
      )}

      {expectations.map((exp, i) => {
        const method = exp.httpRequest.method;
        const path = exp.httpRequest.path ?? '(any path)';
        const status = exp.httpResponse?.statusCode;
        const soapAction = getSoapAction(exp.httpRequest);
        const isSelected = selected === exp;

        return (
          <div
            key={exp.id ?? i}
            className={`request-row ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(exp)}
          >
            {method ? (
              <MethodBadge method={method} />
            ) : (
              <span className="badge badge-any">ANY</span>
            )}
            <span className="row-path-group">
              <span className="row-path" title={path}>
                {path}
              </span>
              {soapAction && (
                <span className="row-soap-action" title={soapAction}>
                  {soapAction}
                </span>
              )}
            </span>
            {status != null && <StatusBadge statusCode={status} />}
          </div>
        );
      })}
    </div>
  );
}
