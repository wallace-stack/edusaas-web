'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend, Title);

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  student: { id: number; name: string };
  subject: { id: number; name: string };
}
interface SchoolClass { id: number; name: string; }
interface Subject { id: number; name: string; }

function localDate(dateStr: string) {
  const d = new Date(dateStr);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  const now = new Date();
  const diffMs = now.getTime() - local.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return 'Semana 4';
  if (diffDays < 14) return 'Semana 3';
  if (diffDays < 21) return 'Semana 2';
  return 'Semana 1';
}

export default function ProfessorChamadaHistoricoPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my')
      .then((r: { data: SchoolClass[] }) => setClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (classFilter) {
      api.get(`/classes/${classFilter}/subjects`)
        .then((r: { data: Subject[] }) => setSubjects(r.data))
        .catch(console.error);
      setRecords([]);
      setSubjectFilter('');
    }
  }, [classFilter]);

  useEffect(() => {
    if (classFilter && subjectFilter) {
      setLoadingRecords(true);
      api.get(`/attendance/class/${classFilter}/subject/${subjectFilter}`)
        .then((r: { data: AttendanceRecord[] }) => {
          setRecords(r.data);
          if (r.data.length > 0) {
            const dates = [...new Set(r.data.map((rec: AttendanceRecord) => localDate(rec.date)))];
            setExpandedDate(dates[0] as string);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingRecords(false));
    }
  }, [classFilter, subjectFilter]);

  // Agrupa por data
  const byDate: Record<string, AttendanceRecord[]> = {};
  records.forEach(r => {
    const d = localDate(r.date);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });

  const sortedDates = Object.keys(byDate).sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
  });

  // --- Chart data: frequência por aluno ---
  const studentMap: Record<string, { total: number; present: number }> = {};
  records.forEach(r => {
    const name = r.student?.name || 'Desconhecido';
    if (!studentMap[name]) studentMap[name] = { total: 0, present: 0 };
    studentMap[name].total++;
    if (r.status === 'present') studentMap[name].present++;
  });

  const studentNames = Object.keys(studentMap).sort();
  const studentRates = studentNames.map(n =>
    studentMap[n].total > 0 ? Math.round((studentMap[n].present / studentMap[n].total) * 100) : 0
  );

  const barData = {
    labels: studentNames,
    datasets: [{
      label: '% Presença',
      data: studentRates,
      backgroundColor: studentRates.map(r => r >= 75 ? '#22c55e' : '#ef4444'),
      borderWidth: 0,
      borderRadius: 4,
    }],
  };

  const barOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const name = studentNames[ctx.dataIndex];
            const s = studentMap[name];
            return ` ${ctx.raw}% de presença (${s.present}/${s.total} aulas)`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { callback: (v: any) => `${v}%` },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: { grid: { display: false } },
    },
  };

  // --- Chart data: evolução semanal ---
  const WEEK_LABELS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
  const weekMap: Record<string, { total: number; present: number }> = {};
  WEEK_LABELS.forEach(w => { weekMap[w] = { total: 0, present: 0 }; });
  records.forEach(r => {
    const w = getWeekLabel(r.date);
    if (weekMap[w]) {
      weekMap[w].total++;
      if (r.status === 'present') weekMap[w].present++;
    }
  });

  const weekRates = WEEK_LABELS.map(w =>
    weekMap[w].total > 0 ? Math.round((weekMap[w].present / weekMap[w].total) * 100) : null
  );

  const lineData = {
    labels: WEEK_LABELS,
    datasets: [{
      label: 'Frequência Média',
      data: weekRates,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.12)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 8,
      borderWidth: 2,
    }],
  };

  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: { callbacks: { label: (ctx: any) => ctx.raw != null ? ` ${ctx.raw}% de presença` : ' Sem dados' } },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: (v: any) => `${v}%` },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { grid: { display: false } },
    },
  };

  const today = new Date().toLocaleDateString('pt-BR');
  const hasData = records.length > 0;

  const statusIcon = (s: string) => s === 'present'
    ? <CheckCircle size={15} className="text-green-500" />
    : s === 'absent'
    ? <XCircle size={15} className="text-red-500" />
    : <MinusCircle size={15} className="text-orange-500" />;

  const statusLabel = (s: string) => s === 'present' ? 'Presente' : s === 'absent' ? 'Falta' : 'Justificado';

  const selectCls = "px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Histórico de Chamadas</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ) : (
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={selectCls}>
              <option value="">Selecione a turma</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} disabled={!classFilter} className={`${selectCls} disabled:opacity-50`}>
            <option value="">Selecione a disciplina</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {!classFilter || !subjectFilter ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para ver o histórico</p>
          </div>
        ) : loadingRecords ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma chamada registrada ainda</p>
          </div>
        ) : (
          <>
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Barra horizontal — frequência por aluno */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Frequência por Aluno</p>
                <div style={{ height: Math.max(studentNames.length * 32, 160) }}>
                  <Bar data={barData} options={barOptions} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> ≥ 75%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt; 75%</span>
                </div>
              </div>

              {/* Linha — evolução semanal */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Evolução da Frequência (4 semanas)</p>
                <div style={{ height: 220 }}>
                  <Line data={lineData} options={lineOptions} />
                </div>
              </div>
            </div>

            {/* Histórico por data */}
            <div className="space-y-3">
              {sortedDates.map(date => {
                const dayRecords = byDate[date];
                const present = dayRecords.filter(r => r.status === 'present').length;
                const absent = dayRecords.filter(r => r.status === 'absent').length;
                const justified = dayRecords.filter(r => r.status === 'justified').length;
                const isExpanded = expandedDate === date;
                const isToday = date === today;

                return (
                  <div key={date} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <button
                      onClick={() => setExpandedDate(isExpanded ? null : date)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {isToday ? 'Hoje' : date}
                            {isToday && <span className="text-xs text-gray-400 ml-2">{date}</span>}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dayRecords.length} alunos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600 font-medium">✓ {present}</span>
                          <span className="text-red-500 font-medium">✗ {absent}</span>
                          {justified > 0 && <span className="text-orange-500 font-medium">~ {justified}</span>}
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-50 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                        {dayRecords
                          .sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''))
                          .map(r => (
                            <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">{(r.student?.name || 'A').charAt(0)}</span>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-200">{r.student?.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {statusIcon(r.status)}
                                <span className="text-xs text-gray-500 dark:text-gray-400">{statusLabel(r.status)}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
