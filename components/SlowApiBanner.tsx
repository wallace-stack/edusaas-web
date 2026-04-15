'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Exibe um banner fixo quando requisições à API demoram mais de 8s.
 * Ouve o evento customizado 'api:slow' despachado por app/lib/api.ts.
 */
export default function SlowApiBanner() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleSlow = (e: Event) => {
      const { slow } = (e as CustomEvent<{ slow: boolean }>).detail;
      if (slow) {
        setVisible(true);
      } else {
        // Mantém visível por 1s após o término para evitar piscar
        timerRef.current = setTimeout(() => setVisible(false), 1_000);
      }
    };

    window.addEventListener('api:slow', handleSlow);
    return () => window.removeEventListener('api:slow', handleSlow);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5
                    bg-[#1E3A5F] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl
                    animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Loader2 size={16} className="animate-spin shrink-0" />
      Conectando ao servidor… aguarde um momento.
    </div>
  );
}
