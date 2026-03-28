'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Bell, BookOpen, AlertTriangle, XCircle, Megaphone, CheckCheck } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  class?: { name: string };
}

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  exam_scheduled: { label: 'Prova Agendada', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700', icon: BookOpen },
  exam_changed: { label: 'Prova Alterada', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700', icon: AlertTriangle },
  exam_cancelled: { label: 'Prova Cancelada', color: 'bg-red-50 dark:bg-red-950 text-red-700', icon: XCircle },
  class_notice: { label: 'Aviso', color: 'bg-purple-50 dark:bg-purple-950 text-purple-700', icon: Megaphone },
  system: { label: 'Sistema', color: 'bg-gray-50 dark:bg-gray-800 text-gray-600', icon: Bell },
  payment_due: { label: 'Mensalidade', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700', icon: Bell },
  payment_overdue: { label: 'Mensalidade Vencida', color: 'bg-red-50 dark:bg-red-950 text-red-700', icon: Bell },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function AlunoAvisosPage() {
  const router = useRouter();
  const user = getUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Avisos</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs text-[#1E3A5F] dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              <CheckCheck size={14} />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-purple-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum aviso por enquanto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const config = typeConfig[n.type] ?? { label: n.type, color: 'bg-gray-50 dark:bg-gray-800 text-gray-600', icon: Bell };
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all cursor-pointer ${
                    n.isRead
                      ? 'border-gray-100 dark:border-gray-800 opacity-70'
                      : 'border-[#1E3A5F]/20 dark:border-blue-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {!n.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {n.class && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">· {n.class.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
