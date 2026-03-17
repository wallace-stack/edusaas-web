'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Tuition {
  id: number;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: string;
  reference: string;
  paymentMethod: string;
}

export default function AlunoFinanceiroPage() {
  const router = useRouter();
  const user = getUser();
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadTuitions();
  }, []);

  const loadTuitions = async () => {
    try {
      const response = await api.get('/finance/tuitions/my');
      setTuitions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const paid = tuitions.filter(t => t.status === 'paid');
  const pending = tuitions.filter(t => t.status === 'pending');
  const overdue = tuitions.filter(t => t.status === 'overdue');

  const statusConfig: any = {
    paid: { label: 'Pago', color: 'bg-green-50 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
    pending: { label: 'Pendente', color: 'bg-orange-50 text-orange-700', icon: Clock, iconColor: 'text-orange-500' },
    overdue: { label: 'Vencido', color: 'bg-red-50 text-red-700', icon: AlertTriangle, iconColor: 'text-red-500' },
  };

  const paymentMethodLabel: any = {
    pix: 'PIX',
    cash: 'Dinheiro',
    card: 'Cartão',
    bank_slip: 'Boleto',
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
          <h1 className="font-bold text-[#1E3A5F]">Minhas Mensalidades</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
            <p className="text-2xl font-bold text-green-600">{paid.length}</p>
            <p className="text-xs text-green-700 mt-1">Pagas</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center">
            <p className="text-2xl font-bold text-orange-500">{pending.length}</p>
            <p className="text-xs text-orange-700 mt-1">Pendentes</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
            <p className="text-2xl font-bold text-red-500">{overdue.length}</p>
            <p className="text-xs text-red-700 mt-1">Vencidas</p>
          </div>
        </div>

        {/* Alerta de vencidas */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Você tem {overdue.length} mensalidade(s) vencida(s)!</p>
              <p className="text-xs text-red-500">Entre em contato com a secretaria para regularizar.</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {tuitions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma mensalidade encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tuitions.map((tuition) => {
              const config = statusConfig[tuition.status] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <div key={tuition.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                      <Icon size={18} className={config.iconColor} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{tuition.reference || 'Mensalidade'}</p>
                      <p className="text-xs text-gray-400">
                        {tuition.status === 'paid'
                          ? `Pago em ${new Date(tuition.paidDate).toLocaleDateString('pt-BR')} via ${paymentMethodLabel[tuition.paymentMethod] || tuition.paymentMethod}`
                          : `Vence em ${new Date(tuition.dueDate).toLocaleDateString('pt-BR')}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">
                      R$ {Number(tuition.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                      {config.label}
                    </span>
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