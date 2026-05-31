'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Instalar app"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: hovered ? '8px' : '0px',
        overflow: 'hidden',
        maxWidth: hovered ? '160px' : '40px',
        padding: '10px',
        borderRadius: '999px',
        background: 'rgba(30, 58, 95, 0.85)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'max-width 0.3s ease, gap 0.3s ease, opacity 0.3s ease',
        opacity: hovered ? 1 : 0.65,
      }}
    >
      <Download size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease',
        overflow: 'hidden',
      }}>
        Instalar app
      </span>
    </button>
  );
}
