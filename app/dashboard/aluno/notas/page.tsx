'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft } from 'lucide-react';

interface Grade {
  id: number;
  value: number;
  type: string;
  description: string;
  period: number;
  subject: { name: string };
  createdAt: string;
}

const typeLabel: any = {
  exam: 'Prova',
  assignment: 'Trabalho',
  quiz: 'Quiz',
  final: 'Final',
};

export default function AlunoNotasPage() {
  const router = useRouter();
  const user = getUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const response = await api.get('/grades/my-grades');
      setGrades(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = periodFilter
    ? grades.filter(g => g.period === Number(periodFilter))
    : grades;

  // Agrupa por disciplina
  const bySubject: any = {};
  filtered.forEach(g => {
    const name = g.subject?.name || 'Sem disciplina';
    if (!bySubject[name]) bySubject[name] = [];
    bySubject[name].push(g);
  });

  const getAverage = (grades: Grade[]) => {
    if (!grades.length) return 0;
    const sum = grades.reduce((acc, g) => acc + Number(g.value), 0);
    return Math.round((sum / grades.length) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="font-bold text-[#1E3A5F]">Minhas Notas</h1>
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white"
          >
            <option value="">Todos os bimestres</option>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {Object.keys(bySubject).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma nota lançada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySubject).map(([subject, subjectGrades]: any) => {
              const avg = getAverage(subjectGrades);
              return (
                <div key={subject} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-[#1E3A5F]">{subject}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Média:</span>
                      <span className={`text-lg font-bold ${avg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                        {avg.toFixed(1)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avg >= 6 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {avg >= 6 ? 'Aprovado' : 'Reprovado'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {subjectGrades.map((grade: Grade) => (
                      <div key={grade.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">{typeLabel[grade.type]} — {grade.period}º Bimestre</p>
                          {grade.description && <p className="text-xs text-gray-400">{grade.description}</p>}
                        </div>
                        <span className={`text-xl font-bold ${Number(grade.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                          {Number(grade.value).toFixed(1)}
                        </span>
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