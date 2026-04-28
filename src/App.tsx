import { useState } from 'react';
import ExpectationDetail from './components/ExpectationDetail';
import ExpectationList from './components/ExpectationList';
import Header from './components/Header';
import RequestDetail from './components/RequestDetail';
import RequestList from './components/RequestList';
import { ResizeHandle } from './components/ui/ResizeHandle';
import { useConfig } from './hooks/useConfig';
import { useExpectations } from './hooks/useExpectations';
import { usePanelResize } from './hooks/usePanelResize';
import { useRequestLogs } from './hooks/useRequestLogs';
import { useRequestPolling } from './hooks/useRequestPolling';
import { Expectation, RequestResponseEntry } from './types';
import { findBestMatch, getSoapAction } from './utils';

type View = 'requests' | 'expectations';

export default function App() {
  const { config, handleConfigChange } = useConfig();
  const { allEntries, connected, autoRefresh, toggleAutoRefresh, refresh, handleClear } =
    useRequestPolling(config);
  const [selectedEntry, setSelectedEntry] = useState<RequestResponseEntry | null>(null);
  const [pathFilter, setPathFilter] = useState('');
  const logs = useRequestLogs(config, selectedEntry);

  const [view, setView] = useState<View>('requests');
  const {
    expectations,
    loading: expLoading,
    error: expError,
    refresh: refreshExpectations,
    clear: clearExpectations,
  } = useExpectations(config);
  const [selectedExpectation, setSelectedExpectation] = useState<Expectation | null>(null);
  const { width: panelWidth, onMouseDown: onResizeMouseDown } = usePanelResize();

  const bestMatch = selectedEntry ? findBestMatch(selectedEntry.httpRequest, expectations) : null;

  function handleClearAll() {
    handleClear();
    setSelectedEntry(null);
    setPathFilter('');
  }

  const visibleEntries = allEntries.filter((e) => {
    const term = pathFilter.toLowerCase();
    if (!term) return true;
    if (e.httpRequest.path.toLowerCase().includes(term)) return true;
    const soapAction = getSoapAction(e.httpRequest);
    return soapAction?.toLowerCase().includes(term) ?? false;
  });

  const visibleExpectations = expectations.filter((exp) => {
    const term = pathFilter.toLowerCase();
    if (!term) return true;
    if ((exp.httpRequest.path ?? '').toLowerCase().includes(term)) return true;
    const soapAction = getSoapAction(exp.httpRequest);
    return soapAction?.toLowerCase().includes(term) ?? false;
  });

  const filterActive = pathFilter.trim().length > 0;

  return (
    <div className="app">
      <Header
        config={config}
        onConfigChange={handleConfigChange}
        connected={connected}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        onRefresh={refresh}
        onClear={handleClearAll}
        pathFilter={pathFilter}
        onPathFilterChange={setPathFilter}
      />

      <div className="view-nav">
        <button
          className={`view-tab ${view === 'requests' ? 'view-tab-active' : ''}`}
          onClick={() => setView('requests')}
        >
          Requests
          {allEntries.length > 0 && <span className="tab-badge">{allEntries.length}</span>}
        </button>
        <button
          className={`view-tab ${view === 'expectations' ? 'view-tab-active' : ''}`}
          onClick={() => {
            setView('expectations');
            refreshExpectations();
          }}
        >
          Expectations
          {expectations.length > 0 && <span className="tab-badge">{expectations.length}</span>}
        </button>
      </div>

      {view === 'requests' && (
        <div className="content">
          <RequestList
            entries={visibleEntries}
            selectedEntry={selectedEntry}
            onSelect={setSelectedEntry}
            width={panelWidth}
            filterActive={filterActive}
            hiddenCount={allEntries.length - visibleEntries.length}
          />
          <ResizeHandle onMouseDown={onResizeMouseDown} />
          <RequestDetail entry={selectedEntry} logs={logs} bestMatch={bestMatch} />
        </div>
      )}

      {view === 'expectations' && (
        <div className="content">
          <ExpectationList
            expectations={visibleExpectations}
            selected={selectedExpectation}
            onSelect={setSelectedExpectation}
            loading={expLoading}
            error={expError}
            onRefresh={refreshExpectations}
            onClear={clearExpectations}
            width={panelWidth}
            filterActive={filterActive}
            hiddenCount={expectations.length - visibleExpectations.length}
          />
          <ResizeHandle onMouseDown={onResizeMouseDown} />
          <ExpectationDetail expectation={selectedExpectation} />
        </div>
      )}
    </div>
  );
}
