import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Layers,
  Columns,
  SlidersHorizontal,
  Minus,
  Plus,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

type ComparisonMode = 'overlay' | 'side-by-side' | 'slider';

interface ComparisonViewProps {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  onBack: () => void;
}

export function ComparisonView({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  onBack,
}: ComparisonViewProps) {
  const [mode, setMode] = useState<ComparisonMode>('overlay');
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const scale = zoom / 100;

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 25));
  const resetZoom = () => setZoom(100);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700" />

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setMode('overlay')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'overlay'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Overlay
          </button>
          <button
            onClick={() => setMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'side-by-side'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>
          <button
            onClick={() => setMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'slider'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Slider
          </button>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Opacity (only in overlay mode) */}
        {mode === 'overlay' && (
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
            <span className="text-xs text-slate-300 w-8 text-right">
              {opacity}%
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-300 w-10 text-center">{zoom}%</span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe error banner */}
      {iframeError && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          The website may block iframe embedding (X-Frame-Options). Try a site you own or one that allows embedding.
        </div>
      )}

      {/* Main comparison area */}
      <div className="flex-1 overflow-auto bg-slate-950 relative">
        <div className="min-h-full flex items-start justify-center p-8">
          {mode === 'overlay' && (
            <OverlayMode
              imageUrl={imageUrl}
              websiteUrl={websiteUrl}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              opacity={opacity}
              scale={scale}
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
              scale={scale}
              onIframeLoad={handleIframeLoad}
            />
          )}
          {mode === 'slider' && (
            <SliderMode
              imageUrl={imageUrl}
              websiteUrl={websiteUrl}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              scale={scale}
              onIframeLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-1.5 flex items-center gap-4 text-xs text-slate-500">
        <span>
          Frame: {frameWidth} x {frameHeight}px
        </span>
        <span>Zoom: {zoom}%</span>
        <span className={`${iframeLoaded ? 'text-emerald-500' : 'text-amber-500'}`}>
          {iframeLoaded ? 'Site loaded' : 'Loading site...'}
        </span>
        <span className="truncate max-w-xs ml-auto">{websiteUrl}</span>
      </div>
    </div>
  );
}

function OverlayMode({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  opacity,
  scale,
  onIframeLoad,
  onIframeError,
  iframeLoaded,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  opacity: number;
  scale: number;
  onIframeLoad: () => void;
  onIframeError: () => void;
  iframeLoaded: boolean;
}) {
  return (
    <div
      className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800"
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
      }}
    >
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading website...</span>
          </div>
        </div>
      )}
      <iframe
        src={websiteUrl}
        title="Website Preview"
        className="absolute inset-0 border-0"
        style={{
          width: frameWidth,
          height: frameHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        onLoad={onIframeLoad}
        onError={onIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <img
          src={imageUrl}
          alt="Design overlay"
          className="block w-full h-full object-cover object-top"
          style={{ opacity: opacity / 100 }}
        />
      </div>
    </div>
  );
}

function SideBySideMode({
  imageUrl,
  websiteUrl,
  frameWidth,
  frameHeight,
  scale,
  onIframeLoad,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  onIframeLoad: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(scale);

  useEffect(() => {
    const updateFitScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const gap = 48;
      const maxPanelWidth = (availableWidth - gap) / 2;
      const autoScale = Math.min(scale, maxPanelWidth / frameWidth);
      setFitScale(autoScale);
    };
    updateFitScale();
    window.addEventListener('resize', updateFitScale);
    return () => window.removeEventListener('resize', updateFitScale);
  }, [scale, frameWidth]);

  const panelWidth = frameWidth * fitScale;
  const panelHeight = frameHeight * fitScale;

  return (
    <div ref={containerRef} className="flex gap-4 items-start w-full justify-center">
      <div className="flex flex-col items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Design
        </span>
        <div
          className="shadow-2xl rounded-lg overflow-hidden border border-slate-800"
          style={{ width: panelWidth, height: panelHeight }}
        >
          <img
            src={imageUrl}
            alt="Design"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Production
        </span>
        <div
          className="shadow-2xl rounded-lg overflow-hidden border border-slate-800 relative"
          style={{ width: panelWidth, height: panelHeight }}
        >
          <iframe
            src={websiteUrl}
            title="Website Preview"
            className="absolute inset-0 border-0"
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${fitScale})`,
              transformOrigin: 'top left',
            }}
            onLoad={onIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
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
  scale,
  onIframeLoad,
}: {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  onIframeLoad: () => void;
}) {
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

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

  return (
    <div
      ref={sliderContainerRef}
      className="relative shadow-2xl rounded-lg overflow-hidden cursor-col-resize select-none border border-slate-800"
      style={{ width: scaledWidth, height: scaledHeight }}
      onMouseDown={handleMouseDown}
    >
      {/* Transparent overlay to block iframe from stealing mouse events */}
      <div className="absolute inset-0 z-[5]" />

      {/* Website (full background) */}
      <iframe
        src={websiteUrl}
        title="Website Preview"
        className="absolute inset-0 border-0 pointer-events-none"
        style={{
          width: frameWidth,
          height: frameHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        onLoad={onIframeLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />

      {/* Design image (clipped to left of slider) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-10"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={imageUrl}
          alt="Design"
          style={{ width: scaledWidth, height: scaledHeight }}
          className="block object-cover object-top"
        />
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-black z-20 pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-black shadow-lg border-2 border-slate-700 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
