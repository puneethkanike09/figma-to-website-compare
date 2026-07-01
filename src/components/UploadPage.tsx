import { useState, useCallback, useRef } from 'react';
import { Upload, Image, Globe, ArrowRight, X } from 'lucide-react';

interface UploadPageProps {
  onStartComparison: (data: {
    imageUrl: string;
    websiteUrl: string;
    frameWidth: number;
    frameHeight: number;
  }) => void;
}

export function UploadPage({ onStartComparison }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [frameWidth, setFrameWidth] = useState<number>(0);
  const [frameHeight, setFrameHeight] = useState<number>(0);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.match(/^image\/(png|jpeg|svg\+xml)$/)) {
      setError('Please upload a PNG, JPEG, or SVG file.');
      return;
    }
    setError(null);
    setFile(selectedFile);

    const url = URL.createObjectURL(selectedFile);
    setPreview(url);

    const img = new window.Image();
    img.onload = () => {
      setFrameWidth(img.naturalWidth);
      setFrameHeight(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setFrameWidth(0);
    setFrameHeight(0);
  };

  const handleSubmit = () => {
    if (!file || !websiteUrl || !frameWidth || !frameHeight) {
      setError('Please fill in all fields.');
      return;
    }

    let finalUrl = websiteUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    onStartComparison({
      imageUrl: preview!,
      websiteUrl: finalUrl,
      frameWidth,
      frameHeight,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-sky-400 bg-sky-400/5'
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">
                Drop your design file here
              </p>
              <p className="text-slate-500 text-sm">
                PNG, JPEG, or SVG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div className="border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {file.name}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Image className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                Frame Width (px)
              </label>
              <input
                type="number"
                value={frameWidth || ''}
                onChange={(e) => setFrameWidth(Number(e.target.value))}
                placeholder="e.g. 1440"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Image className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                Frame Height (px)
              </label>
              <input
                type="number"
                value={frameHeight || ''}
                onChange={(e) => setFrameHeight(Number(e.target.value))}
                placeholder="e.g. 900"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Globe className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
              Deployed Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://your-website.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || !websiteUrl}
            className="w-full py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            Start Comparison
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
