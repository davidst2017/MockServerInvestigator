/**
 * Provides drag-to-resize behaviour for a left panel.
 * Returns the current width in px and a mousedown handler to attach to a resize handle.
 * The width is clamped between minWidth and maxWidth.
 */
import { useCallback, useRef, useState } from 'react';

const MIN_WIDTH = 200;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 340;

export function usePanelResize() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startWidth = width;

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX));
      setWidth(next);
    }

    function onMouseUp() {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [width]);

  return { width, onMouseDown };
}
