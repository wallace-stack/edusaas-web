'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Bell, Plus, X, BookOpen, AlertTriangle, XCircle, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass { id: number; name: string; }
interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  class?: { name: string };
}

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  exam_scheduled: { label: 'Prova Agendada', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700', icon: BookOpen },
  exam_changed: { label: 'Prova Alterada', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700', icon: AlertTriangle },
  exam_cancelled: { label: 'Prova Cancelada', color: 'bg-red-50 dark:bg-red-950 text-red-700', icon: XCircle },
  class_notice: { label: 'Aviso', color: 'bg-purple-50 dark:bg-purple-950 text-purple-700', icon: Megaphone },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

export default function ProfessorNotificacoesPage() {
  const router = useRouter();
  const user = getUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editNotif, setEditNotif] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'exam_scheduled',
    classId: '',
    examDate: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, classRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/classes/my'),
      ]);
      setNotifications(notifRes.data);
      setClasses(classRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) { setError('Selecione a turma'); return; }
    try {
      setSaving(true);
      setError('');
      const message = form.examDate
        ? `${form.message}\n\n📅 Data: ${new Date(form.examDate).toLocaleDateString('pt-BR')}`
        : form.message;
      await api.post('/notifications', {
        title: form.title,
        message,
        type: form.type,
        target: 'class',
        classId: Number(form.classId),
      });
      setShowModal(false);
      setForm({ title: '', message: '', type: 'exam_scheduled', classId: '', examDate: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar notificação');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este aviso?')) return;
    try {
      setDeleting(id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir');
    } finally { setDeleting(null); }
  };

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
            <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Avisos da Turma</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-[#1E3A5F] text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#162d4a]"
          >
            <Plus size={14} />
            Novo aviso
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <Bell size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aviso enviado ainda</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-[#F97316] hover:underline">
              Criar primeiro aviso
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const config = typeConfig[n.type] ?? { label: n.type, color: 'bg-gray-50 dark:bg-gray-800 text-gray-600', icon: Bell };
              const Icon = config.icon;
              return (
                <div key={n.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2 justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          {n.class && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">· {n.class.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); setEditNotif(n); }}
                            className="text-xs text-gray-400 hover:text-[#1E3A5F] dark:hover:text-white px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                            disabled={deleting === n.id}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                          >
                            {deleting === n.id ? '...' : 'Excluir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-white">Novo aviso</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <select
                value={form.classId}
                onChange={e => setForm({ ...form, classId: e.target.value })}
                required
                className={inputCls}
              >
                <option value="">Selecione a turma *</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className={inputCls}
              >
                <option value="exam_scheduled">📚 Prova Agendada</option>
                <option value="exam_changed">⚠️ Prova Alterada</option>
                <option value="exam_cancelled">❌ Prova Cancelada</option>
                <option value="class_notice">📢 Aviso Geral</option>
              </select>

              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Título do aviso"
                required
                maxLength={100}
                className={inputCls}
              />

              {(form.type === 'exam_scheduled' || form.type === 'exam_changed') && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data da prova</label>
                  <input
                    value={form.examDate}
                    onChange={e => setForm({ ...form, examDate: e.target.value })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className={inputCls}
                  />
                </div>
              )}

              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva o aviso para os alunos..."
                required
                rows={4}
                maxLength={500}
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-gray-400 text-right">{form.message.length}/500</p>

              {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {saving ? 'Enviando...' : 'Enviar aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editNotif && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-white">Editar aviso</h2>
              <button onClick={() => setEditNotif(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                await api.patch(`/notifications/${editNotif.id}`, {
                  title: editNotif.title,
                  message: editNotif.message,
                });
                setEditNotif(null);
                loadData();
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Erro ao editar');
              }
            }} className="p-4 space-y-3">
              <input
                value={editNotif.title}
                onChange={e => setEditNotif({ ...editNotif, title: e.target.value })}
                placeholder="Título"
                required
                className={inputCls}
              />
              <textarea
                value={editNotif.message}
                onChange={e => setEditNotif({ ...editNotif, message: e.target.value })}
                placeholder="Mensagem"
                required
                rows={4}
                className={`${inputCls} resize-none`}
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditNotif(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a]">
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
