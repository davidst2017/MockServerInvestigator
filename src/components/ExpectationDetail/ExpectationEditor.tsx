interface ExpectationEditorProps {
  draft: string;
  parseError: string | null;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ExpectationEditor({
  draft,
  parseError,
  saveState,
  saveError,
  onChange,
  onSave,
  onCancel,
}: ExpectationEditorProps) {
  const canSave = !parseError && saveState !== 'saving';

  return (
    <div className="expectation-editor">
      <div className="expectation-editor-toolbar">
        <span className="expectation-editor-title">Edit Expectation</span>
        <div className="expectation-editor-actions">
          {saveState === 'saved' && (
            <span className="editor-status editor-status-ok">✓ Saved</span>
          )}
          {saveState === 'error' && saveError && (
            <span className="editor-status editor-status-err" title={saveError}>
              ✕ {saveError}
            </span>
          )}
          {parseError && (
            <span className="editor-status editor-status-err">{parseError}</span>
          )}
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={!canSave}>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <textarea
        className={`expectation-editor-textarea${parseError ? ' expectation-editor-textarea-error' : ''}`}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
