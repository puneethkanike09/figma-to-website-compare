import { useEffect, type RefObject } from 'react';
import type { ScrollMode } from './useComparisonScroll';

type UseViewportWheelOptions = {
  scrollMode: ScrollMode;
  designPanelRef?: RefObject<HTMLElement | null>;
  /** When true (side-by-side design panel), iframe ignores pointer — scroll website via wheel handler. */
  iframeBlocksPointer?: boolean;
  onDesignWheel: (deltaY: number) => void;
  onWebsiteWheel: (deltaY: number) => void;
  disabled?: boolean;
};

function isWheelOverDesignPanel(
  e: WheelEvent,
  designPanelRef: RefObject<HTMLElement | null> | undefined
) {
  if (!designPanelRef?.current) return false;

  if (designPanelRef.current.contains(e.target as Node)) {
    return true;
  }

  const hit = document.elementFromPoint(e.clientX, e.clientY);
  return hit !== null && designPanelRef.current.contains(hit);
}

/**
 * Design: capture all wheels → design only.
 * Website: native iframe scroll over production; programmatic scroll on design panel.
 */
export function useViewportWheel(
  containerRef: RefObject<HTMLElement | null>,
  {
    scrollMode,
    designPanelRef,
    iframeBlocksPointer = false,
    onDesignWheel,
    onWebsiteWheel,
    disabled = false,
  }: UseViewportWheelOptions
) {
  useEffect(() => {
    if (disabled) return;

    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (scrollMode === 'design') {
        e.preventDefault();
        onDesignWheel(e.deltaY);
        return;
      }

      if (iframeBlocksPointer || isWheelOverDesignPanel(e, designPanelRef)) {
        e.preventDefault();
        onWebsiteWheel(e.deltaY);
        return;
      }

      // Side-by-side production panel: native iframe scroll.
    };

    el.addEventListener('wheel', handler, { capture: true, passive: false });
    return () => el.removeEventListener('wheel', handler, { capture: true });
  }, [containerRef, scrollMode, designPanelRef, iframeBlocksPointer, onDesignWheel, onWebsiteWheel, disabled]);
}
