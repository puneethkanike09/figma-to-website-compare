import { useState, useRef, useCallback, useEffect, type ReactNode, type RefObject } from 'react';
import {
  Layers,
  Columns,
  SlidersHorizontal,
  Minus,
  Plus,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { WebsiteFrame } from './WebsiteFrame';
import { useComparisonScroll, type ScrollMode } from '../hooks/useComparisonScroll';
import { useViewportWheel } from '../hooks/useViewportWheel';

type ComparisonMode = 'overlay' | 'side-by-side' | 'slider';

interface ComparisonViewProps {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  onBack: () => void;
}

function usePanelHeight(areaRef: RefObject<HTMLDivElement>, contentRef: RefObject<HTMLDivElement>) {
  const [panelHeight, setPanelHeight] = useState(800);

  useEffect(() => {
    const measure = () => {
      const content = contentRef.current;
      if (content) {
        setPanelHeight(Math.max(400, content.clientHeight));
        return;
      }
      const area = areaRef.current;
      if (!area) return;
      const styles = getComputedStyle(area);
      const paddingY =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      setPanelHeight(Math.max(400, area.clientHeight - paddingY));
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    else if (areaRef.current) observer.observe(areaRef.current);

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [areaRef, contentRef]);

  return panelHeight;
}

function ScrollModePicker({
  value,
  onChange,
}: {
  value: ScrollMode;
  onChange: (mode: ScrollMode) => void;
}) {
  const options: { id: ScrollMode; label: string }[] = [
    { id: 'design', label: 'Design' },
    { id: 'website', label: 'Website' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {options.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ComparisonView({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  onBack,
}: ComparisonViewProps) {
  const [mode, setMode] = useState<ComparisonMode>('side-by-side');
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [iframeError, setIframeError] = useState(false);
  const [scrollMode, setScrollMode] = useState<ScrollMode>('design');

  const areaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelHeight = usePanelHeight(areaRef, contentRef);

  const {
    iframeRef,
    designScrollY,
    websiteScrollY,
    applyDesignWheel,
    applyWebsiteWheel,
    iframeLoaded,
    reloadIframe,
    handleIframeLoad,
  } = useComparisonScroll(scrollMode);

  const scale = zoom / 100;
  const viewportHeight = Math.min(frameHeight, Math.max(400, Math.round(panelHeight / scale)));
  const maxScroll = Math.max(0, frameHeight - viewportHeight);
  const iframeInteractable = scrollMode === 'website' && mode !== 'slider';

  useEffect(() => {
    setIframeError(false);
  }, [scrollMode]);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 25));
  const resetZoom = () => setZoom(100);

  const handleReload = () => {
    setIframeError(false);
    reloadIframe();
  };

  const handleDesignWheel = useCallback(
    (deltaY: number) => {
      applyDesignWheel(deltaY, maxScroll);
    },
    [applyDesignWheel, maxScroll]
  );

  const handleWebsiteWheel = useCallback(
    (deltaY: number) => {
      applyWebsiteWheel(deltaY, maxScroll);
    },
    [applyWebsiteWheel, maxScroll]
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700" />

        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {(['overlay', 'side-by-side', 'slider'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === m ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'overlay' && <Layers className="w-3.5 h-3.5" />}
              {m === 'side-by-side' && <Columns className="w-3.5 h-3.5" />}
              {m === 'slider' && <SlidersHorizontal className="w-3.5 h-3.5" />}
              {m === 'overlay' ? 'Overlay' : m === 'side-by-side' ? 'Side by Side' : 'Slider'}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-700" />

        <span className="text-xs text-slate-500">Scroll</span>
        <ScrollModePicker value={scrollMode} onChange={setScrollMode} />

        {mode === 'overlay' && (
          <>
            <div className="h-5 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Opacity</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-28 h-1.5 accent-sky-500 cursor-pointer"
              />
              <span className="text-xs text-slate-300 w-8 text-right">{opacity}%</span>
            </div>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reload site to replay animations"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
        </button>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-300 w-10 text-center">{zoom}%</span>
          <button onClick={zoomIn} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetZoom} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {iframeError && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          Could not load the site. Check the URL and try Reload.
        </div>
      )}

      <div ref={areaRef} className="flex-1 min-h-0 overflow-hidden p-4 bg-slate-950">
        <div ref={contentRef} className="h-full min-h-0 flex items-stretch justify-center">
          {mode === 'overlay' && (
            <OverlayMode
              imageUrl={imageUrl}
              websiteUrl={websiteUrl}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              viewportHeight={viewportHeight}
              panelHeight={panelHeight}
              opacity={opacity}
              scale={scale}
              designScrollY={designScrollY}
              scrollMode={scrollMode}
              iframeInteractable={iframeInteractable}
              onDesignWheel={handleDesignWheel}
              onWebsiteWheel={handleWebsiteWheel}
              iframeRef={iframeRef}
              onIframeLoad={handleIframeLoad}
              onIframeError={() => setIframeError(true)}
              iframeLoaded={iframeLoaded}
            />
          )}
          {mode === 'side-by-side' && (
            <SideBySideMode
              imageUrl={imageUrl}
              websiteUrl={websiteUrl}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              panelHeight={panelHeight}
              scale={scale}
              designScrollY={designScrollY}
              scrollMode={scrollMode}
              iframeInteractable={iframeInteractable}
              onDesignWheel={handleDesignWheel}
              onWebsiteWheel={handleWebsiteWheel}
              wheelCaptureRef={areaRef}
              iframeRef={iframeRef}
              onIframeLoad={handleIframeLoad}
            />
          )}
          {mode === 'slider' && (
            <SliderMode
              imageUrl={imageUrl}
              websiteUrl={websiteUrl}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              viewportHeight={viewportHeight}
              panelHeight={panelHeight}
              scale={scale}
              designScrollY={designScrollY}
              scrollMode={scrollMode}
              onDesignWheel={handleDesignWheel}
              onWebsiteWheel={handleWebsiteWheel}
              iframeRef={iframeRef}
              onIframeLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>

      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-1.5 flex items-center gap-4 text-xs text-slate-500">
        <span>Frame: {frameWidth} x {frameHeight}px</span>
        <span>Design scroll: {Math.round(designScrollY)}px</span>
        <span>Site scroll: {Math.round(websiteScrollY)}px</span>
        <span>Scroll: {scrollMode}</span>
        <span>Zoom: {zoom}%</span>
        <span className={iframeLoaded ? 'text-emerald-500' : 'text-amber-500'}>
          {iframeLoaded ? 'Site ready' : 'Loading site...'}
        </span>
        <span className="truncate max-w-xs ml-auto">{websiteUrl}</span>
      </div>
    </div>
  );
}

function DesignImage({
  imageUrl,
  frameWidth,
  frameHeight,
  scale,
  scrollY,
  opacity = 1,
  className = '',
}: {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  scrollY: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <img
      src={imageUrl}
      alt="Design"
      draggable={false}
      className={`block object-cover object-top ${className}`}
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        transform: `translateY(${-scrollY * scale}px)`,
        opacity,
      }}
    />
  );
}

function ViewportShell({
  frameWidth,
  panelHeight,
  scale,
  children,
  className = '',
  shellRef,
}: {
  frameWidth: number;
  panelHeight: number;
  scale: number;
  children: ReactNode;
  className?: string;
  shellRef?: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={shellRef}
      className={`relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white ${className}`}
      style={{ width: frameWidth * scale, height: panelHeight }}
    >
      {children}
    </div>
  );
}

function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-30">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading website...</span>
      </div>
    </div>
  );
}

function OverlayMode({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  viewportHeight,
  panelHeight,
  opacity,
  scale,
  designScrollY,
  scrollMode,
  iframeInteractable,
  onDesignWheel,
  onWebsiteWheel,
  iframeRef,
  onIframeLoad,
  onIframeError,
  iframeLoaded,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  viewportHeight: number;
  panelHeight: number;
  opacity: number;
  scale: number;
  designScrollY: number;
  scrollMode: ScrollMode;
  iframeInteractable: boolean;
  onDesignWheel: (deltaY: number) => void;
  onWebsiteWheel: (deltaY: number) => void;
  iframeRef: RefObject<HTMLIFrameElement>;
  onIframeLoad: () => void;
  onIframeError: () => void;
  iframeLoaded: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useViewportWheel(viewportRef, {
    scrollMode,
    onDesignWheel,
    onWebsiteWheel,
  });

  return (
    <ViewportShell
      frameWidth={frameWidth}
      panelHeight={panelHeight}
      scale={scale}
      shellRef={viewportRef}
    >
      <LoadingOverlay show={!iframeLoaded} />
      <WebsiteFrame
        ref={iframeRef}
        websiteUrl={websiteUrl}
        frameWidth={frameWidth}
        viewportHeight={viewportHeight}
        scale={scale}
        interactable={iframeInteractable}
        onLoad={onIframeLoad}
        onError={onIframeError}
      />
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <DesignImage
          imageUrl={imageUrl}
          frameWidth={frameWidth}
          frameHeight={frameHeight}
          scale={scale}
          scrollY={designScrollY}
          opacity={opacity / 100}
        />
      </div>
    </ViewportShell>
  );
}

function SideBySideMode({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  panelHeight,
  scale,
  designScrollY,
  scrollMode,
  iframeInteractable,
  onDesignWheel,
  onWebsiteWheel,
  wheelCaptureRef,
  iframeRef,
  onIframeLoad,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  panelHeight: number;
  scale: number;
  designScrollY: number;
  scrollMode: ScrollMode;
  iframeInteractable: boolean;
  onDesignWheel: (deltaY: number) => void;
  onWebsiteWheel: (deltaY: number) => void;
  wheelCaptureRef: RefObject<HTMLDivElement>;
  iframeRef: RefObject<HTMLIFrameElement>;
  onIframeLoad: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const designPanelRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(scale);

  useEffect(() => {
    const updateFitScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth || window.innerWidth;
      const gap = 32;
      const maxPanelWidth = (availableWidth - gap) / 2;
      setFitScale(Math.min(scale, maxPanelWidth / frameWidth));
    };
    updateFitScale();
    window.addEventListener('resize', updateFitScale);
    return () => window.removeEventListener('resize', updateFitScale);
  }, [scale, frameWidth]);

  const panelWidth = frameWidth * fitScale;
  const columnHeaderHeight = 28;
  const iframeViewportHeight = Math.min(
    frameHeight,
    Math.round((panelHeight - columnHeaderHeight) / fitScale)
  );

  useViewportWheel(wheelCaptureRef, {
    scrollMode,
    designPanelRef,
    onDesignWheel,
    onWebsiteWheel,
  });

  return (
    <div ref={containerRef} className="flex gap-4 items-stretch h-full w-full justify-center">
      <div ref={designPanelRef} className="flex flex-col min-h-0 min-w-0 h-full">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center mb-2 flex-shrink-0">
          Design
        </span>
        <div
          className="relative flex-1 min-h-0 shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
          style={{ width: panelWidth }}
        >
          <DesignImage
            imageUrl={imageUrl}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            scale={fitScale}
            scrollY={designScrollY}
          />
        </div>
      </div>

      <div className="flex flex-col min-h-0 min-w-0 h-full">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center mb-2 flex-shrink-0">
          Production
        </span>
        <div
          className="relative flex-1 min-h-0 shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white"
          style={{ width: panelWidth }}
        >
          <WebsiteFrame
            ref={iframeRef}
            websiteUrl={websiteUrl}
            frameWidth={frameWidth}
            viewportHeight={iframeViewportHeight}
            scale={fitScale}
            interactable={iframeInteractable}
            onLoad={onIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}

function SliderMode({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  viewportHeight,
  panelHeight,
  scale,
  designScrollY,
  scrollMode,
  onDesignWheel,
  onWebsiteWheel,
  iframeRef,
  onIframeLoad,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  viewportHeight: number;
  panelHeight: number;
  scale: number;
  designScrollY: number;
  scrollMode: ScrollMode;
  onDesignWheel: (deltaY: number) => void;
  onWebsiteWheel: (deltaY: number) => void;
  iframeRef: RefObject<HTMLIFrameElement>;
  onIframeLoad: () => void;
}) {
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const scaledWidth = frameWidth * scale;

  const updatePosition = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX);
    };
    const handleMouseUp = () => setDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, updatePosition]);

  useViewportWheel(sliderContainerRef, {
    scrollMode,
    onDesignWheel,
    onWebsiteWheel,
    disabled: dragging,
  });

  const websiteInteractable = scrollMode === 'website' && !dragging;

  return (
    <div
      ref={sliderContainerRef}
      className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white self-stretch"
      style={{ width: scaledWidth, height: panelHeight }}
    >
      <WebsiteFrame
        ref={iframeRef}
        websiteUrl={websiteUrl}
        frameWidth={frameWidth}
        viewportHeight={viewportHeight}
        scale={scale}
        interactable={websiteInteractable}
        onLoad={onIframeLoad}
      />

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-10"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <DesignImage
          imageUrl={imageUrl}
          frameWidth={frameWidth}
          frameHeight={frameHeight}
          scale={scale}
          scrollY={designScrollY}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 z-30 cursor-col-resize select-none touch-none"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
          width: 24,
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-black pointer-events-none"
          aria-hidden
        />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-black shadow-lg border-2 border-slate-700 flex items-center justify-center pointer-events-none">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
