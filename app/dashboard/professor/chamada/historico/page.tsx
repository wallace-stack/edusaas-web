'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  student: { id: number; name: string };
  subject: { id: number; name: string };
}

interface SchoolClass { id: number; name: string; }
interface Subject { id: number; name: string; }

export default function ProfessorChamadaHistoricoPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my').then(r => setClasses(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (classFilter) {
      api.get(`/classes/${classFilter}/subjects`).then(r => setSubjects(r.data)).catch(console.error);
      setRecords([]);
    }
  }, [classFilter]);

  useEffect(() => {
    if (classFilter && subjectFilter) {
      api.get(`/attendance/class/${classFilter}/subject/${subjectFilter}`).then(r => setRecords(r.data)).catch(console.error);
    }
  }, [classFilter, subjectFilter]);

  const filtered = dateFilter
    ? records.filter(r => {
        const recordDate = new Date(r.date);
        const localDate = new Date(recordDate.getTime() + recordDate.getTimezoneOffset() * 60000);
        const localDateStr = localDate.toISOString().split('T')[0];
        return localDateStr === dateFilter;
      })
    : records;

  // Agrupa por data
  const byDate: Record<string, AttendanceRecord[]> = {};
  filtered.forEach(r => {
    const date = new Date(r.date).toLocaleDateString('pt-BR');
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(r);
  });

  const statusIcon = (status: string) => {
    if (status === 'present') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'absent') return <XCircle size={16} className="text-red-500" />;
    return <MinusCircle size={16} className="text-orange-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'present') return 'Presente';
    if (status === 'absent') return 'Falta';
    return 'Justificado';
  };

  const inputCls = "px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setSubjectFilter(''); }} className={inputCls}>
            <option value="">Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} disabled={!classFilter} className={`${inputCls} disabled:opacity-50`}>
            <option value="">Selecione a disciplina</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            disabled={!subjectFilter}
            className={`${inputCls} disabled:opacity-50`}
          />
        </div>

        {!classFilter || !subjectFilter ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para ver o histórico</p>
          </div>
        ) : Object.keys(byDate).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma chamada registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayRecords]) => {
              const present = dayRecords.filter(r => r.status === 'present').length;
              const absent = dayRecords.filter(r => r.status === 'absent').length;
              return (
                <div key={date} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white">{date}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-600 font-medium">✓ {present} presentes</span>
                      <span className="text-red-500 font-medium">✗ {absent} faltas</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {dayRecords.sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || '')).map(r => (
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
