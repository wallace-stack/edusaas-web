'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
  }

  if (installed || !deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        color: '#fff', fontSize: '13px', fontWeight: 700,
        border: 'none', cursor: 'pointer',
      }}
    >
      <Download size={14} strokeWidth={2} />
      Instalar app
    </button>
  );
}
