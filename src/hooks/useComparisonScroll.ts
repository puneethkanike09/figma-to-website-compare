import { useCallback, useRef, useState } from 'react';

export type ScrollMode = 'design' | 'website';

function scrollIframeBy(iframe: HTMLIFrameElement | null, deltaY: number) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.scrollBy({ top: deltaY, left: 0, behavior: 'instant' });
  } catch {
    try {
      iframe.contentWindow.scrollBy(0, deltaY);
    } catch {
      // Cross-origin sites may block programmatic scroll.
    }
  }
}

function scrollIframeTo(iframe: HTMLIFrameElement | null, y: number) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.scrollTo(0, y);
  } catch {
    // Cross-origin sites may block programmatic scroll.
  }
}

export function useComparisonScroll(scrollMode: ScrollMode) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [designScrollY, setDesignScrollYState] = useState(0);
  const [websiteScrollY, setWebsiteScrollYState] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const designScrollYRef = useRef(0);
  const websiteScrollYRef = useRef(0);

  designScrollYRef.current = designScrollY;
  websiteScrollYRef.current = websiteScrollY;

  const applyDesignWheel = useCallback(
    (deltaY: number, maxScroll: number) => {
      if (scrollMode === 'design') {
        setDesignScrollYState((prev) => {
          const next = Math.min(maxScroll, Math.max(0, prev + deltaY));
          designScrollYRef.current = next;
          return next;
        });
      }
    },
    [scrollMode]
  );

  const applyWebsiteWheel = useCallback(
    (deltaY: number, maxScroll: number) => {
      if (scrollMode === 'website') {
        scrollIframeBy(iframeRef.current, deltaY);
        setWebsiteScrollYState((prev) => {
          const next = Math.min(maxScroll, Math.max(0, prev + deltaY));
          websiteScrollYRef.current = next;
          return next;
        });
      }
    },
    [scrollMode]
  );

  const reloadIframe = useCallback(() => {
    setIframeLoaded(false);
    setDesignScrollYState(0);
    setWebsiteScrollYState(0);
    designScrollYRef.current = 0;
    websiteScrollYRef.current = 0;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const src = iframe.src;
    iframe.src = '';
    requestAnimationFrame(() => {
      iframe.src = src;
    });
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    scrollIframeTo(iframeRef.current, websiteScrollYRef.current);
  }, []);

  return {
    iframeRef,
    designScrollY,
    websiteScrollY,
    applyDesignWheel,
    applyWebsiteWheel,
    iframeLoaded,
    reloadIframe,
    handleIframeLoad,
  };
}
