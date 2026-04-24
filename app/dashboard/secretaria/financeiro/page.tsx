// v3 — força rebuild Vercel — fix hidratação SSR
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import Cookies from 'js-cookie';
import {
  ArrowLeft, DollarSign, AlertTriangle, Clock, Check,
  Bell, Search, X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  inadimplencia: number;
  statusChart: { received: number; pending: number; overdue: number };
  paymentMethodChart: Record<string, number>;
  monthlyChart: { month: string; received: number; pending: number; overdue: number }[];
}

interface Tuition {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  reference: string;
  status: 'pending' | 'overdue' | 'paid';
  paymentMethod?: string;
  paymentNotes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'pix',         label: 'PIX',      icon: '⚡' },
  { value: 'credit_card', label: 'Crédito',  icon: '💳' },
  { value: 'debit_card',  label: 'Débito',   icon: '🏦' },
  { value: 'cash',        label: 'Dinheiro', icon: '💵' },
  { value: 'bank_slip',   label: 'Boleto',   icon: '📄' },
  { value: 'other',       label: 'Outro',    icon: '•••' },
];

const METHOD_LABEL: Record<string, string> = {
  pix: 'PIX', credit_card: 'Crédito', debit_card: 'Débito',
  cash: 'Dinheiro', bank_slip: 'Boleto', card: 'Cartão', other: 'Outro',
};

const STATUS_TABS = [
  { key: 'overdue',  label: 'Em atraso' },
  { key: 'pending',  label: 'Pendentes' },
  { key: 'paid',     label: 'Pagas' },
];

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ─── Mini Chart (CSS-based bar chart for monthly data) ────────────────────────

function MonthlyBars({ data }: { data: Summary['monthlyChart'] }) {
  const max = Math.max(...data.flatMap(d => [d.received, d.pending + d.overdue]), 1);
  return (
    <div className="flex items-end gap-2 h-28 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '80px' }}>
            <div
              className="w-full rounded-t bg-green-400/80"
              style={{ height: `${(d.received / max) * 80}px` }}
              title={`Recebido: ${fmt(d.received)}`}
            />
            <div
              className="w-full rounded-t bg-amber-300/70"
              style={{ height: `${((d.pending + d.overdue) / max) * 80}px` }}
              title={`Pendente/Atraso: ${fmt(d.pending + d.overdue)}`}
            />
          </div>
          <span className="text-[9px] text-gray-400 leading-none">{d.month.slice(0, 6)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut (SVG) ─────────────────────────────────────────────────────────────

function Donut({ slices, colors, labels }: {
  slices: number[];
  colors: string[];
  labels: string[];
}) {
  const total = slices.reduce((a, b) => a + b, 0) || 1;
  const r = 40;
  const cx = 56, cy = 56;
  let offset = -0.25 * (2 * Math.PI * r); // start top

  const paths = slices.map((s, i) => {
    const pct = s / total;
    const arc = pct * 2 * Math.PI * r;

    // use stroke-dasharray trick
    const dashArr = `${arc} ${2 * Math.PI * r - arc}`;
    const dashOff = -offset;
    offset += arc;
    return { dashArr, dashOff, color: colors[i], label: labels[i], value: s };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="112" height="112" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="20" />
        {paths.map((p, i) => (
          p.value > 0 && (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="20"
              strokeDasharray={p.dashArr}
              strokeDashoffset={p.dashOff}
              className="transition-all"
            />
          )
        ))}
      </svg>
      <div className="space-y-1.5">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{p.label}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 ml-1">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SecretariaFinanceiroPage() {
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState<Summary | null>(null);
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overdue' | 'pending' | 'paid'>('overdue');
  const [search, setSearch] = useState('');

  // modal
  const [selected, setSelected] = useState<Tuition | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paidDate, setPaidDate] = useState(now.toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadData = async () => {
    console.log('[Financeiro] loadData iniciado', { month, year });
    setLoading(true);
    try {
      const [summaryRes, tuitionsRes] = await Promise.all([
        api.get(`/secretary/financial/summary?month=${month}&year=${year}`),
        api.get(`/secretary/financial/tuitions?month=${month}&year=${year}&status=all`),
      ]);
      console.log('[Financeiro] dados recebidos', { summary: summaryRes.data, count: tuitionsRes.data?.length });
      setSummary(summaryRes.data);
      setTuitions(tuitionsRes.data ?? []);
    } catch (err: any) {
      console.error('[Financeiro] erro:', err.response?.status, err.response?.data?.message);
      toast.error('Erro ao carregar financeiro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('[Financeiro v3] mounted=true, verificando user...');

    const currentUser = getUser();
    console.log('[Financeiro v3] getUser result:', !!currentUser);

    if (!currentUser) {
      console.log('[Financeiro v3] sem user, redirecionando');
      router.push('/login');
      return;
    }

    console.log('[Financeiro v3] chamando loadData', { month, year });
    loadData();
  }, [mounted, month, year]);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = tuitions.filter(t => {
    if (t.status !== activeTab) return false;
    if (search && !t.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Modal ──────────────────────────────────────────────────────────────────

  function openModal(t: Tuition) {
    setSelected(t);
    setPaymentMethod('');
    setPaymentNotes('');
    setPaidDate(now.toISOString().split('T')[0]);
  }

  function closeModal() { setSelected(null); }

  async function handlePay() {
    if (!selected || !paymentMethod) { toast.error('Selecione a forma de pagamento.'); return; }
    setSaving(true);
    try {
      await api.post('/secretary/financial/payment', {
        tuitionId: selected.id,
        paymentMethod,
        paymentNotes: paymentNotes || undefined,
        paidDate,
      });
      toast.success(`Pagamento de ${selected.studentName} registrado!`);
      closeModal();
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao registrar pagamento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleNotifyOverdue() {
    setNotifying(true);
    try {
      const { data } = await api.post('/secretary/financial/notify-overdue');
      toast.success(`${data.sent} e-mail(s) enviado(s).${data.errors ? ` ${data.errors} falha(s).` : ''}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao enviar notificações.');
    } finally {
      setNotifying(false);
    }
  }

  const handleExportFiscal = async () => {
    try {
      const token = Cookies.get('token');
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/secretary/financial/export-fiscal?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `relatorio-fiscal-${year}-${String(month).padStart(2, '0')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório fiscal exportado!');
    } catch (err: any) {
      console.error('[ExportFiscal] erro:', err);
      toast.error('Erro ao exportar relatório');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusSlices = summary
    ? [summary.statusChart.received, summary.statusChart.pending, summary.statusChart.overdue]
    : [0, 0, 0];

  const methodEntries = summary ? Object.entries(summary.paymentMethodChart) : [];
  const methodColors = ['#6366f1','#22c55e','#f59e0b','#3b82f6','#ec4899','#94a3b8'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white">Financeiro</h1>
              <p className="text-xs text-gray-400">{MONTHS[month - 1]} {year}</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              {MONTHS.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
            </select>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleExportFiscal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar fiscal
            </button>
            <button
              onClick={handleNotifyOverdue}
              disabled={notifying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-50 transition-colors"
            >
              <Bell size={13} />
              {notifying ? 'Enviando…' : 'Cobrar inadimplentes'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <DollarSign size={16} className="text-green-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Recebido</p>
              <p className="text-base font-bold text-green-600">{fmt(summary.totalReceived)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <Clock size={16} className="text-amber-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Pendente</p>
              <p className="text-base font-bold text-amber-600">{fmt(summary.totalPending)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <AlertTriangle size={16} className="text-red-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Em atraso</p>
              <p className="text-base font-bold text-red-600">{fmt(summary.totalOverdue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 mt-5 mb-0.5">Inadimplência</p>
              <p className="text-base font-bold text-[#1E3A5F] dark:text-white">{summary.inadimplencia}%</p>
            </div>
          </div>
        )}

        {/* Charts row */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Status donut */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Status das mensalidades</p>
              <Donut
                slices={statusSlices}
                colors={['#22c55e', '#f59e0b', '#ef4444']}
                labels={['Pagas', 'Pendentes', 'Em atraso']}
              />
            </div>

            {/* Payment method donut */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Formas de pagamento</p>
              {methodEntries.length === 0 ? (
                <p className="text-xs text-gray-400 mt-4">Nenhum pagamento no período.</p>
              ) : (
                <Donut
                  slices={methodEntries.map(([, v]) => v)}
                  colors={methodEntries.map((_, i) => methodColors[i % methodColors.length])}
                  labels={methodEntries.map(([k]) => METHOD_LABEL[k] ?? k)}
                />
              )}
            </div>

            {/* Monthly bars */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Últimos 6 meses</p>
              <div className="flex gap-3 mb-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-sm bg-green-400/80 inline-block" /> Recebido
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-sm bg-amber-300/70 inline-block" /> Pendente
                </span>
              </div>
              <MonthlyBars data={summary.monthlyChart} />
            </div>
          </div>
        )}

        {/* Tuition list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Tabs + Search */}
          <div className="px-5 pt-4 pb-0 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex gap-1">
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-[#1E3A5F] text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar aluno…"
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] w-44"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 pb-2">{filtered.length} lançamento(s)</p>
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Check size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum registro nesta categoria.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(t => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.studentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.reference || 'Sem referência'} · vence {fmtDate(t.dueDate)}
                      {t.paidDate && ` · pago ${fmtDate(t.paidDate)}`}
                      {t.paymentMethod && ` · ${METHOD_LABEL[t.paymentMethod] ?? t.paymentMethod}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fmt(t.amount)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.status === 'overdue'
                          ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          : t.status === 'paid'
                          ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}>
                        {t.status === 'overdue' ? 'Em atraso' : t.status === 'paid' ? 'Paga' : 'Pendente'}
                      </span>
                    </div>
                    {t.status !== 'paid' && (
                      <button
                        onClick={() => openModal(t)}
                        className="px-3 py-1.5 rounded-xl bg-[#1E3A5F] text-white text-xs font-medium hover:bg-[#162d4a] transition-colors"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Payment modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-[#1E3A5F] dark:text-white text-sm">Registrar pagamento</p>
                <p className="text-xs text-gray-400 mt-0.5">{selected.studentName} · {fmt(selected.amount)}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Data do pagamento</label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={e => setPaidDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Forma de pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        paymentMethod === m.value
                          ? 'border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F] dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={saving || !paymentMethod}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Salvando…' : 'Confirmar pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
