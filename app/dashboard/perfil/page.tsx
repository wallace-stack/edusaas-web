'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../lib/auth';
import api from '../../lib/api';
import { ArrowLeft, Save, CheckCircle, AlertCircle, User as UserIcon } from 'lucide-react';

const roleLabels: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator: 'Coordenador(a)',
  secretary: 'Secretário(a)',
  teacher: 'Professor(a)',
  student: 'Aluno(a)',
};

export default function PerfilPage() {
  const router = useRouter();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', document: '', birthDate: '',
    address: '', city: '', state: '', zipCode: '',
    addressNumber: '', complement: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
  });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/users/me/profile');
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        document: data.document || '',
        birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        addressNumber: data.addressNumber || '',
        complement: data.complement || '',
        guardianName: data.guardianName || '',
        guardianPhone: data.guardianPhone || '',
        guardianRelation: data.guardianRelation || '',
      });
      setEmail(data.email || '');
      setRole(data.role || '');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCep = async (cep: string) => {
    setForm(f => ({ ...f, zipCode: cep }));
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(f => ({ ...f, address: data.logradouro || f.address, city: data.localidade || f.city, state: data.uf || f.state }));
        }
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch('/users/me/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-colors";

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Meu perfil</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {success && (
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Perfil atualizado com sucesso!</p>
          </div>
        )}

        {/* Avatar + info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{form.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <p className="font-semibold text-[#1E3A5F] dark:text-white text-lg">{form.name || 'Sem nome'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
            <span className="text-xs bg-[#1E3A5F]/10 dark:bg-[#1E3A5F]/30 text-[#1E3A5F] dark:text-blue-300 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              {roleLabels[role] || role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados pessoais */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-[#1E3A5F] dark:text-white text-sm mb-4">Dados pessoais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nome completo</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Telefone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CPF</label>
                <input value={form.document} onChange={e => setForm({...form, document: e.target.value})} className={inputCls} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data de nascimento</label>
                <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">E-mail</label>
                <input value={email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-[#1E3A5F] dark:text-white text-sm mb-4">Endereço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CEP</label>
                <input value={form.zipCode} onChange={e => handleCep(e.target.value)} className={inputCls} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Endereço</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Número</label>
                <input value={form.addressNumber} onChange={e => setForm({...form, addressNumber: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Complemento</label>
                <input value={form.complement} onChange={e => setForm({...form, complement: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cidade</label>
                <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</label>
                <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className={inputCls} maxLength={2} />
              </div>
            </div>
          </div>

          {/* Responsável (só para alunos) */}
          {role === 'student' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="font-semibold text-[#1E3A5F] dark:text-white text-sm mb-4">Responsável</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nome</label>
                  <input value={form.guardianName} onChange={e => setForm({...form, guardianName: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Telefone</label>
                  <input value={form.guardianPhone} onChange={e => setForm({...form, guardianPhone: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Parentesco</label>
                  <input value={form.guardianRelation} onChange={e => setForm({...form, guardianRelation: e.target.value})} className={inputCls} placeholder="Mãe, Pai, etc." />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#162d4a] disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </main>
    </div>
  );
}
