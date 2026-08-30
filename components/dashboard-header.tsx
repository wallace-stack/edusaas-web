'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, LogOut } from 'lucide-react';
import { getUser, clearAuth } from '@/app/lib/auth';
import api from '@/app/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardHeaderProps {
  /** Rótulo de papel ("Painel da Secretaria") na tela raiz, ou título da página em subtelas ("Alunos", "Financeiro"). */
  subtitle: string;
  /** Mostra a seta de voltar (subtelas) em vez do link pra home (raiz do dashboard). */
  showBack?: boolean;
  /** Contagem de avisos não lidos; omitido esconde o sino. */
  unreadCount?: number;
  /** Rota do sino de notificações. */
  notificationsHref?: string;
  /** Botões específicos da página (filtros, exportar, etc.), renderizados numa linha própria pra não competir por espaço com a marca/escola. */
  actions?: ReactNode;
}

// Nome da escola nunca vem de valor espelhado no cliente (cookie de user, etc.) —
// sempre buscado aqui, resolvido no backend a partir do schoolId do token. Evita
// mostrar a escola errada pra quem tem conta em mais de uma (login multi-escola).
function useSchoolName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.get('/schools/me/name')
      .then(r => { if (!cancelled) setName(r.data?.name ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return name;
}

export function DashboardHeader({
  subtitle,
  showBack = false,
  unreadCount,
  notificationsHref = '/dashboard/secretaria/notificacoes',
  actions,
}: DashboardHeaderProps) {
  const router = useRouter();
  const user = getUser();
  const schoolName = useSchoolName();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          ) : (
            <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <img src="/logo-icon.png" alt="Walladm" className="h-8 w-auto" />
            </Link>
          )}
          {/* Marca por extenso some primeiro no mobile — nome da escola tem prioridade,
              a pessoa pode confundir a escola, dificilmente esquece o próprio papel. */}
          <span className="hidden sm:inline font-bold text-base tracking-tight text-[#1E3A5F] dark:text-white flex-shrink-0">
            Wall<span className="text-[#F5A623]">adm</span>
          </span>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
          <div className="min-w-0 leading-tight">
            <p className="font-bold text-sm text-[#1E3A5F] dark:text-white truncate">
              {schoolName ?? ' '}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {unreadCount !== undefined && (
            <button onClick={() => router.push(notificationsHref)} className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={() => router.push('/dashboard/perfil')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#F97316] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">{user?.name}</span>
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden md:block">Sair</span>
          </button>
        </div>
      </div>

      {actions && (
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
}
