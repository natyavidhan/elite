import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X } from 'lucide-react';

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (cancelled) return;
        if (result) {
          onDetected(result.getText());
        }
        if (err && err.name !== 'NotFoundException') {
          // transient per-frame decode misses are expected; ignore
        }
      })
      .then((c) => {
        controls = c;
      })
      .catch(() => {
        if (!cancelled) setError('Camera access was denied or is unavailable.');
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-ink-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="plate-caption text-xs text-paper-300">Scan Barcode</span>
        <button onClick={onClose} aria-label="Close scanner" className="text-paper-100 p-1">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <p className="text-paper-300 text-sm px-8 text-center">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        )}
        {!error && (
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-vermilion-500 rounded-[2px]" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
