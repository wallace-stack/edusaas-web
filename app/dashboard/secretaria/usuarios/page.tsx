'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: 'teacher' | 'coordinator';
  isActive: boolean;
  createdAt: string;
}

const roleLabel: Record<string, string> = {
  teacher: 'Professor',
  coordinator: 'Coordenador',
  secretary: 'Secretaria',
};

const roleColor: Record<string, string> = {
  teacher: 'bg-green-50 dark:bg-green-950 text-green-700',
  coordinator: 'bg-blue-50 dark:bg-blue-950 text-blue-700',
  secretary: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
};

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

export default function SecretariaUsuariosPage() {
  const router = useRouter();
  const user = getUser();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/secretary/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/secretary/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`Desativar o usuário "${name}"?`)) return;
    try {
      await api.delete(`/secretary/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Usuários</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            Novo usuário
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Busca */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Nenhum usuário encontrado</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Função</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[u.role] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {roleLabel[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-red-50 dark:bg-red-950 text-red-700'}`}>
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.isActive && (
                        <button
                          onClick={() => handleDeactivate(u.id, u.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                          title="Desativar usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal novo usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white mb-4">Novo usuário</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                required
                className={inputCls}
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                placeholder="Email"
                required
                className={inputCls}
              />
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                type="password"
                placeholder="Senha"
                required
                className={inputCls}
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputCls}
              >
                <option value="teacher">Professor</option>
                <option value="coordinator">Coordenador</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
