'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, Plus, X, Heart, Zap, Smile, Star, BookOpen,
  ToggleLeft, ToggleRight, Pencil, Send,
} from 'lucide-react';
import { toast } from 'sonner';

type Category = 'inspirational' | 'affectionate' | 'funny' | 'motivational' | 'educational';

interface SystemMessage {
  id: number;
  category: Category;
  message: string;
  author?: string;
  isActive: boolean;
  sentCount: number;
  createdAt: string;
}

const categoryConfig: Record<Category, { label: string; color: string; icon: any }> = {
  inspirational: { label: 'Inspiracional',  color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',  icon: Star     },
  affectionate:  { label: 'Carinhosa',      color: 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300',       icon: Heart    },
  funny:         { label: 'Engraçada',       color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',   icon: Smile    },
  motivational:  { label: 'Motivacional',   color: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300',icon: Zap      },
  educational:   { label: 'Educacional',    color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',        icon: BookOpen },
};

const CATEGORY_OPTIONS = Object.entries(categoryConfig).map(([value, { label }]) => ({ value, label }));

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]';

export default function MensagensSistemaPage() {
  const router = useRouter();
  const user = getUser();

  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SystemMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'inspirational', message: '', author: '' });

  useEffect(() => {
    if (!user || user.role !== 'director') { router.push('/login'); return; }
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await api.get('/notifications/system-messages');
      setMessages(res.data);
    } catch {
      toast.error('Erro ao carregar mensagens.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ category: 'inspirational', message: '', author: '' });
    setShowModal(true);
  };

  const openEdit = (msg: SystemMessage) => {
    setEditing(msg);
    setForm({ category: msg.category, message: msg.message, author: msg.author ?? '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('Mensagem obrigatória.'); return; }
    setSaving(true);
    try {
      const payload = { category: form.category, message: form.message.trim(), author: form.author.trim() || undefined };
      if (editing) {
        await api.patch(`/notifications/system-messages/${editing.id}`, payload);
        toast.success('Mensagem atualizada!');
      } else {
        await api.post('/notifications/system-messages', payload);
        toast.success('Mensagem criada!');
      }
      setShowModal(false);
      loadMessages();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar mensagem.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (msg: SystemMessage) => {
    try {
      await api.patch(`/notifications/system-messages/${msg.id}/toggle`);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isActive: !m.isActive } : m));
      toast.success(msg.isActive ? 'Mensagem desativada.' : 'Mensagem ativada!');
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const filtered = messages.filter(m => {
    const catOk = filterCat === 'all' || m.category === filterCat;
    const actOk = filterActive === 'all' || (filterActive === 'active' ? m.isActive : !m.isActive);
    return catOk && actOk;
  });

  const total = messages.length;
  const active = messages.filter(m => m.isActive).length;
  const totalSent = messages.reduce((s, m) => s + m.sentCount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                Mensagens Carinhosas
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Enviadas automaticamente a cada 72 horas</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            Nova mensagem
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total de mensagens', value: total, color: 'text-[#1E3A5F] dark:text-white' },
            { label: 'Ativas', value: active, color: 'text-green-600' },
            { label: 'Envios realizados', value: totalSent, color: 'text-pink-600', icon: Send },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-5">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none"
          >
            <option value="all">Ativas e inativas</option>
            <option value="active">Somente ativas</option>
            <option value="inactive">Somente inativas</option>
          </select>
          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} mensagem(s)</span>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma mensagem encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => {
              const cfg = categoryConfig[msg.category];
              const Icon = cfg.icon;
              return (
                <div
                  key={msg.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-opacity ${msg.isActive ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-50'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone categoria */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Send size={10} />
                          {msg.sentCount} envio{msg.sentCount !== 1 ? 's' : ''}
                        </span>
                        {!msg.isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {msg.message}
                      </p>
                      {msg.author && (
                        <p className="text-xs text-gray-400 mt-1 italic">— {msg.author}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(msg)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(msg)}
                        className={`p-1.5 rounded-lg ${msg.isActive ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={msg.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {msg.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal criar / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                {editing ? 'Editar mensagem' : 'Nova mensagem'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Categoria *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className={inputCls}
                  required
                >
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mensagem *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Escreva a mensagem carinhosa..."
                  required
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Autor (opcional)</label>
                <input
                  value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  placeholder="Ex: Nelson Mandela"
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar mensagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
