import { useState } from 'react';
import { Expectation, LogEntry, RequestResponseEntry } from '../types';
import { LogsTab } from './RequestDetail/LogsTab';
import { RequestTab } from './RequestDetail/RequestTab';

interface RequestDetailProps {
  entry: RequestResponseEntry | null;
  logs: LogEntry[];
  bestMatch: Expectation | null;
}

type Tab = 'request' | 'logs';

export default function RequestDetail({ entry, logs, bestMatch }: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('request');

  if (!entry) {
    return (
      <div className="request-detail">
        <div className="empty-state">Select a request to inspect it.</div>
      </div>
    );
  }

  return (
    <div className="request-detail">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'request' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          Request / Response
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Match Logs {logs.length > 0 && <span className="tab-badge">{logs.length}</span>}
        </button>
      </div>

      {activeTab === 'request' && <RequestTab entry={entry} bestMatch={bestMatch} />}
      {activeTab === 'logs' && <LogsTab logs={logs} />}
    </div>
  );
}
