import { useState } from 'react';
import { ConnectionConfig, Expectation } from '../types';
import { useExpectationEditor } from '../hooks/useExpectationEditor';
import { ExpectationEditor } from './ExpectationDetail/ExpectationEditor';
import { ForwardSection } from './ExpectationDetail/ForwardSection';
import { RequestMatcherSection } from './ExpectationDetail/RequestMatcherSection';
import { ResponseSection } from './ExpectationDetail/ResponseSection';
import { TimesSection } from './ExpectationDetail/TimesSection';

interface ExpectationDetailProps {
  expectation: Expectation | null;
  config: ConnectionConfig;
  onSaved: () => void;
}

export default function ExpectationDetail({ expectation, config, onSaved }: ExpectationDetailProps) {
  const [editing, setEditing] = useState(false);
  const editor = useExpectationEditor(config, () => {
    onSaved();
    setEditing(false);
  });

  function handleEdit() {
    if (!expectation) return;
    editor.open(expectation);
    setEditing(true);
  }

  if (!expectation) {
    return (
      <div className="request-detail">
        <div className="empty-state">Select an expectation to inspect it.</div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="request-detail">
        <ExpectationEditor
          draft={editor.draft}
          parseError={editor.parseError}
          saveState={editor.saveState}
          saveError={editor.saveError}
          onChange={editor.onChange}
          onSave={editor.save}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="request-detail">
      <div className="expectation-detail-header">
        <button className="btn" onClick={handleEdit}>
          ✎ Edit
        </button>
      </div>
      <div className="tab-content">
        <RequestMatcherSection request={expectation.httpRequest} />
        {expectation.httpResponse && <ResponseSection response={expectation.httpResponse} />}
        {expectation.httpForward && <ForwardSection forward={expectation.httpForward} />}
        {expectation.times && <TimesSection times={expectation.times} />}
      </div>
    </div>
  );
}

