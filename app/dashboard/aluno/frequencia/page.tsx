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
      case 'present': return 'bg-green-50 text-green-700';
      case 'absent': return 'bg-red-50 text-red-700';
      case 'justified': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="font-bold text-[#1E3A5F]">Minha Frequência</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Resumo */}
        <div className={`rounded-2xl p-6 border mb-6 ${data && data.summary.percentage < 75 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
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
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">{data?.summary.present || 0}</p>
              <p className="text-xs text-gray-500">Presenças</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-500">{data?.summary.absent || 0}</p>
              <p className="text-xs text-gray-500">Faltas</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-orange-500">{data?.summary.justified || 0}</p>
              <p className="text-xs text-gray-500">Justificadas</p>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-[#1E3A5F]">Histórico</h2>
          </div>
          {!data?.records.length ? (
            <p className="text-center text-gray-400 text-sm p-8">Nenhum registro ainda</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.records.map((record) => (
                <div key={record.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{record.subject?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
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