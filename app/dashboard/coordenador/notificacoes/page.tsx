'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, Bell, X } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: number;
  title: string;
  message: string;
  target: string;
  classId?: number;
  createdAt: string;
}

interface SchoolClass {
  id: number;
  name: string;
}

const targetLabel: Record<string, string> = {
  ALL_SCHOOL: 'Toda a escola',
  ALL_ADMINS: 'Todos os admins',
  CLASS: 'Turma específica',
};

export default function CoordenadorNotificacoesPage() {
  const router = useRouter();
  const user = getUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'ALL_SCHOOL',
    classId: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, classesRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/classes'),
      ]);
      setNotifications(notifRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/notifications', {
        title: form.title,
        message: form.message,
        target: form.target,
        ...(form.target === 'CLASS' && form.classId ? { classId: Number(form.classId) } : {}),
      });
      toast.success('Aviso criado com sucesso!');
      setShowDialog(false);
      setForm({ title: '', message: '', target: 'ALL_SCHOOL', classId: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar aviso');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Avisos e Notificações</h1>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            Novo aviso
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950 rounded-2xl flex items-center justify-center mb-4">
              <Bell size={28} className="text-[#F97316]" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum aviso criado ainda.</p>
            <button
              onClick={() => setShowDialog(true)}
              className="mt-4 text-sm text-[#1E3A5F] dark:text-blue-400 font-medium hover:underline"
            >
              Criar o primeiro aviso →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-[#1E3A5F] dark:text-white text-sm">{n.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full whitespace-nowrap flex-shrink-0">
                    {targetLabel[n.target] ?? n.target}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{n.message}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dialog — novo aviso */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white">Novo aviso</h2>
              <button onClick={() => setShowDialog(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Título *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Reunião de pais"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mensagem *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Descreva o aviso..."
                  required
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Destinatário *</label>
                <select
                  value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value, classId: '' })}
                  className={inputCls}
                >
                  <option value="ALL_SCHOOL">Toda a escola</option>
                  <option value="ALL_ADMINS">Todos os admins</option>
                  <option value="CLASS">Turma específica</option>
                </select>
              </div>
              {form.target === 'CLASS' && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Turma *</label>
                  <select
                    value={form.classId}
                    onChange={e => setForm({ ...form, classId: e.target.value })}
                    required
                    className={inputCls}
                  >
                    <option value="">Selecione uma turma</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {saving ? 'Enviando...' : 'Publicar aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
