'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Escuta o evento 'api:forbidden' despachado por app/lib/api.ts
 * e exibe um toast de erro amigável em português.
 * Montado uma vez no layout raiz.
 */
export default function ForbiddenToast() {
  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent<{ message: string }>).detail;
      toast.error(message || 'Você não tem permissão para esta ação. Fale com a direção da escola.', {
        duration: 5000,
      });
    };

    window.addEventListener('api:forbidden', handler);
    return () => window.removeEventListener('api:forbidden', handler);
  }, []);

  return null;
}
