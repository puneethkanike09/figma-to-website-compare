import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

interface WebsiteFrameProps {
  websiteUrl: string;
  frameWidth: number;
  viewportHeight: number;
  scale: number;
  interactable?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/** Scrollbar gutter inside the iframe (0 when overlay scrollbars or no scrollbar). */
function measureIframeGutter(iframe: HTMLIFrameElement): number {
  try {
    const innerW = iframe.contentWindow?.innerWidth;
    if (innerW == null) return 0;
    return Math.max(0, iframe.clientWidth - innerW);
  } catch {
    return 0;
  }
}

export const WebsiteFrame = forwardRef<HTMLIFrameElement, WebsiteFrameProps>(
  function WebsiteFrame(
    {
      websiteUrl,
      frameWidth,
      viewportHeight,
      scale,
      interactable = false,
      className = '',
      onLoad,
      onError,
    },
    ref
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [gutter, setGutter] = useState(0);

    useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);

    useEffect(() => {
      setGutter(0);
    }, [websiteUrl, frameWidth]);

    const handleLoad = useCallback(() => {
      const iframe = iframeRef.current;
      if (iframe) {
        setGutter(measureIframeGutter(iframe));
      }
      onLoad?.();
    }, [onLoad]);

    const iframeWidth = frameWidth + gutter;
    const visibleWidth = frameWidth * scale;

    return (
      <div
        className={`absolute inset-0 ${interactable ? '' : 'pointer-events-none'}`}
      >
        <div
          className="absolute top-0 left-0 h-full overflow-hidden"
          style={{ width: visibleWidth }}
        >
          <iframe
            ref={iframeRef}
            src={websiteUrl}
            title="Website Preview"
            className={`block border-0 bg-white ${interactable ? '' : 'pointer-events-none'} ${className}`}
            style={{
              width: iframeWidth,
              height: viewportHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            onLoad={handleLoad}
            onError={onError}
            loading="eager"
            allow={IFRAME_ALLOW}
            scrolling="yes"
          />
        </div>
      </div>
    );
  }
);
