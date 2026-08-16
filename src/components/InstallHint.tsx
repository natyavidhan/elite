import { useEffect, useState } from 'react';
import { X, Share, Download } from 'lucide-react';

const DISMISSED_KEY = 'elite:install-hint-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallHint() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    if (isIOS()) {
      setShowIOSHint(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSHint(false);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    else setDeferredPrompt(null);
  }

  if (dismissed || (!deferredPrompt && !showIOSHint)) return null;

  return (
    <div className="bg-ink-900 text-paper-100 px-4 py-2.5 flex items-center gap-3 text-xs">
      {deferredPrompt ? (
        <>
          <Download size={15} className="text-gold-400 shrink-0" />
          <span className="flex-1">Install Elite for offline, one-tap access.</span>
          <button onClick={handleInstallClick} className="plate-caption text-gold-400 hover:text-gold-300 shrink-0">
            Install
          </button>
        </>
      ) : (
        <>
          <Share size={14} className="text-gold-400 shrink-0" />
          <span className="flex-1">
            Add Elite to your Home Screen: tap <strong className="font-medium">Share</strong>, then{' '}
            <strong className="font-medium">Add to Home Screen</strong>.
          </span>
        </>
      )}
      <button onClick={dismiss} aria-label="Dismiss" className="text-paper-300 hover:text-paper-100 shrink-0">
        <X size={15} />
      </button>
    </div>
  );
}
