import { ConnectionConfig } from '../types';

interface HeaderProps {
  config: ConnectionConfig;
  onConfigChange: (field: keyof ConnectionConfig, value: string) => void;
  connected: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onClear: () => void;
  pathFilter: string;
  onPathFilterChange: (value: string) => void;
}

export default function Header({
  config,
  onConfigChange,
  connected,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onClear,
  pathFilter,
  onPathFilterChange,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span
          className="conn-dot"
          style={{ color: connected ? '#22c55e' : '#ef4444' }}
          title={connected ? 'Connected' : 'Disconnected'}
        >
          ●
        </span>
        <label className="header-label">
          Host
          <input
            className="input input-host"
            type="text"
            value={config.host}
            onChange={(e) => onConfigChange('host', e.target.value)}
          />
        </label>
        <label className="header-label">
          Port
          <input
            className="input input-port"
            type="text"
            value={config.port}
            onChange={(e) => onConfigChange('port', e.target.value)}
          />
        </label>
      </div>

      <div className="header-center">
        <label className="header-label header-filter">
          Filter path
          <input
            className="input input-filter"
            type="text"
            placeholder="e.g. /party-master"
            value={pathFilter}
            onChange={(e) => onPathFilterChange(e.target.value)}
          />
        </label>
      </div>

      <div className="header-right">
        <button className="btn" onClick={onRefresh} title="Refresh now">
          ⟳ Refresh
        </button>
        <button
          className={`btn ${autoRefresh ? 'btn-active' : ''}`}
          onClick={onToggleAutoRefresh}
          title="Toggle auto-refresh every 2s"
        >
          Auto {autoRefresh ? 'ON' : 'OFF'}
        </button>
        <button className="btn btn-danger" onClick={onClear} title="Clear all requests and logs">
          🗑 Clear
        </button>
      </div>
    </header>
  );
}
