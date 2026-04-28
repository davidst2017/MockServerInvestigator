import { useCallback, useState } from 'react';
import { upsertExpectation } from '../api/mockserver';
import { ConnectionConfig, ConnectionError, Expectation } from '../types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useExpectationEditor(config: ConnectionConfig, onSaved: () => void) {
  const [draft, setDraft] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const open = useCallback((expectation: Expectation) => {
    setDraft(JSON.stringify(expectation, null, 2));
    setParseError(null);
    setSaveState('idle');
    setSaveError(null);
  }, []);

  const onChange = useCallback((value: string) => {
    setDraft(value);
    setSaveState('idle');
    setSaveError(null);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch {
      setParseError('Invalid JSON');
    }
  }, []);

  const save = useCallback(async () => {
    let parsed: Expectation;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setParseError('Invalid JSON');
      return;
    }
    setSaveState('saving');
    setSaveError(null);
    try {
      await upsertExpectation(config, parsed);
      setSaveState('saved');
      onSaved();
    } catch (e) {
      setSaveState('error');
      setSaveError(e instanceof ConnectionError ? e.message : 'Failed to save');
    }
  }, [config, draft, onSaved]);

  return { draft, parseError, saveState, saveError, open, onChange, save };
}
