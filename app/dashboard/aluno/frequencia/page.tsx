'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  justification: string;
  subject: { name: string };
}

interface AttendanceSummary {
  records: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    justified: number;
    percentage: number;
  };
  status: string;
}

export default function AlunoFrequenciaPage() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await api.get('/attendance/my-attendance');
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-50 dark:bg-green-950 text-green-700';
      case 'absent': return 'bg-red-50 dark:bg-red-950 text-red-700';
      case 'justified': return 'bg-orange-50 dark:bg-orange-950 text-orange-700';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent': return 'Falta';
      case 'justified': return 'Justificado';
      default: return status;
    }
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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white">Minha Frequência</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Resumo */}
        <div className={`rounded-2xl p-6 border mb-6 ${data && data.summary.percentage < 75 ? 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-800' : 'bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-800'}`}>
          <div className="flex items-center gap-3 mb-4">
            {data && data.summary.percentage < 75
              ? <AlertTriangle size={24} className="text-red-500" />
              : <CheckCircle size={24} className="text-green-500" />
            }
            <div>
              <p className={`font-semibold ${data && data.summary.percentage < 75 ? 'text-red-700' : 'text-green-700'}`}>
                {data?.status}
              </p>
            </div>
            <span className={`ml-auto text-3xl font-bold ${data && data.summary.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
              {data?.summary.percentage || 0}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">{data?.summary.present || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Presenças</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-500">{data?.summary.absent || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Faltas</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-orange-500">{data?.summary.justified || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Justificadas</p>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">
            <h2 className="font-semibold text-[#1E3A5F] dark:text-white">Histórico</h2>
          </div>
          {!data?.records.length ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm p-8">Nenhum registro ainda</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.records.map((record) => (
                <div key={record.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{record.subject?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(record.status)}`}>
                    {statusLabel(record.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
