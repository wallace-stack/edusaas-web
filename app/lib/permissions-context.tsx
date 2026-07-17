'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';
import { getUser } from './auth';

interface PermissionsState {
  role: string | null;
  isDirector: boolean;
  permissions: Record<string, boolean>;
  loading: boolean;
  can: (key: string) => boolean;
}

const PermissionsContext = createContext<PermissionsState>({
  role: null,
  isDirector: false,
  permissions: {},
  loading: true,
  can: () => false,
});

// Chama GET /permissions/me UMA vez por sessão e disponibiliza o mapa achatado de
// permissões pra qualquer tela dentro de /dashboard/*. Isso é só UI — a autorização
// real acontece no backend; esconder um botão aqui não é segurança.
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [isDirector, setIsDirector] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) { setLoading(false); return; }

    api.get('/permissions/me')
      .then(res => {
        setRole(res.data.role);
        setIsDirector(res.data.isDirector);
        setPermissions(res.data.permissions ?? {});
      })
      .catch(() => {
        // Falhou em buscar permissões — mantém tudo fechado (can() retorna false),
        // melhor esconder um botão válido do que mostrar um que vai levar a um 403.
      })
      .finally(() => setLoading(false));
  }, []);

  const can = (key: string) => permissions[key] === true;

  return (
    <PermissionsContext.Provider value={{ role, isDirector, permissions, loading, can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsState {
  return useContext(PermissionsContext);
}
