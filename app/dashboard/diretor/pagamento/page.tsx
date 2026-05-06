'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, CreditCard, QrCode, Link } from 'lucide-react';

const PIX_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave aleatória' },
];

export default function PagamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pixKey: '',
    pixKeyType: 'cpf',
    paymentInfo: '',
    paymentLink: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/schools/me');
        setForm({
          pixKey: res.data.pixKey || '',
          pixKeyType: res.data.pixKeyType || 'cpf',
          paymentInfo: res.data.paymentInfo || '',
          paymentLink: res.data.paymentLink || '',
        });
      } catch {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/schools/payment-config', form);
      toast.success('Configurações salvas! Os e-mails de cobrança já incluirão os dados de pagamento.');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configuração de pagamento</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dados que aparecerão nos e-mails de cobrança dos alunos</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* PIX */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-[#1E3A5F]" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Chave PIX</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de chave</label>
                <select
                  value={form.pixKeyType}
                  onChange={e => setForm({ ...form, pixKeyType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  {PIX_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={form.pixKey}
                  onChange={e => setForm({ ...form, pixKey: e.target.value })}
                  placeholder="Ex: escola@email.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
            </div>
          </div>

          {/* Link de pagamento */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link size={18} className="text-[#1E3A5F]" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Link de pagamento</h2>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">opcional</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (Mercado Pago, PagSeguro, etc)</label>
              <input
                type="url"
                value={form.paymentLink}
                onChange={e => setForm({ ...form, paymentLink: e.target.value })}
                placeholder="https://link.mercadopago.com.br/suaescola"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <p className="text-xs text-gray-400 mt-1">O responsável verá um botão "Pagar agora" no e-mail de cobrança</p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-[#1E3A5F]" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Informações adicionais</h2>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">opcional</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco / instruções de pagamento</label>
              <textarea
                value={form.paymentInfo}
                onChange={e => setForm({ ...form, paymentInfo: e.target.value })}
                placeholder="Ex: Banco Bradesco — Ag. 1234 / CC 56789-0 — Titular: Escola ABC"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl p-6">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">📧 Preview do e-mail de cobrança</p>
            <div className="bg-white rounded-xl p-4 text-sm text-gray-700 space-y-2">
              <p>Olá, <strong>João!</strong></p>
              <p>A mensalidade de <strong>Pedro</strong> — Abril/2026 — <strong>R$ 800,00</strong> está em aberto.</p>
              {(form.pixKey || form.paymentLink || form.paymentInfo) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 space-y-1">
                  <p className="font-bold text-[#1E3A5F]">💳 Como pagar:</p>
                  {form.pixKey && <p>PIX ({form.pixKeyType}): <strong>{form.pixKey}</strong></p>}
                  {form.paymentInfo && <p className="text-gray-600">{form.paymentInfo}</p>}
                  {form.paymentLink && <p className="text-[#1E3A5F] font-medium">→ Clique aqui para pagar online</p>}
                </div>
              )}
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#1E3A5F] text-white font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>

        </div>
      </div>
    </div>
  );
}
