'use client';

import { useEffect, useState } from 'react';
import api from '@/app/lib/api';
import { toast } from 'sonner';
import { usePermissions } from '@/app/lib/permissions-context';

interface ClassOption {
  id: number;
  name: string;
  year?: number;
}

interface EnrollmentActionsProps {
  studentId: number;
  studentName: string;
  className?: string | null;
  enrollmentId?: number | null;
  classes: ClassOption[];
  /** Default true — quando ausente, o chamador não sabe/não checa o status da conta. */
  isActive?: boolean;
  onDone: () => void;
}

export default function EnrollmentActions({
  studentId,
  studentName,
  className,
  enrollmentId,
  classes,
  isActive = true,
  onDone,
}: EnrollmentActionsProps) {
  const { can, loading: permsLoading } = usePermissions();
  const [transferClassId, setTransferClassId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    setTransferClassId('');
    setConfirmUnenroll(false);
    setConfirmDeactivate(false);
  }, [studentId]);

  const handleTransfer = async () => {
    if (!transferClassId) return;
    try {
      setTransferring(true);
      await api.post('/enrollments/transfer', {
        studentId,
        newClassId: Number(transferClassId),
      });
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao matricular');
    } finally {
      setTransferring(false);
    }
  };

  const handleUnenroll = async () => {
    if (!enrollmentId) return;
    try {
      setUnenrolling(true);
      await api.delete(`/enrollments/${enrollmentId}`);
      toast.success(`${studentName} foi desmatriculado da turma.`);
      setConfirmUnenroll(false);
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desmatricular aluno');
    } finally {
      setUnenrolling(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      await api.delete(`/secretary/users/${studentId}`);
      toast.success(`${studentName} foi desativado com sucesso.`);
      setConfirmDeactivate(false);
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desativar aluno');
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setReactivating(true);
      await api.post(`/secretary/users/${studentId}/reactivate`);
      toast.success(`${studentName} reativado(a). Convite enviado por e-mail.`);
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao reativar aluno');
    } finally {
      setReactivating(false);
    }
  };

  if (permsLoading || !can('matricular_aluno')) return null;

  if (!isActive) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
        <p className="text-xs text-amber-800 dark:text-amber-300 text-center">
          Esta conta está desativada.
        </p>
        <button
          onClick={handleReactivate}
          disabled={reactivating}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {reactivating ? 'Reativando...' : 'Reativar conta'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <p className="text-xs text-gray-400 mb-2">
          {className ? 'Transferir para outra turma' : 'Matricular em uma turma'}
        </p>
        <select
          value={transferClassId}
          onChange={e => setTransferClassId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] mb-2"
        >
          <option value="">Selecione a turma</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.year}</option>
          ))}
        </select>
        <button
          onClick={handleTransfer}
          disabled={!transferClassId || transferring}
          className="w-full py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
        >
          {transferring ? 'Salvando...' : className ? 'Confirmar transferência' : 'Matricular nesta turma'}
        </button>
      </div>

      {/* Desmatricular (mantém conta ativa, só tira da turma) */}
      {enrollmentId != null && (
        <div className="pt-2">
          {!confirmUnenroll ? (
            <button
              onClick={() => setConfirmUnenroll(true)}
              className="w-full py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
            >
              Desmatricular
            </button>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium text-center">
                Desmatricular {studentName} da turma {className ?? ''}?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                O aluno continua ativo no sistema, mas sem turma até ser matriculado novamente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmUnenroll(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUnenroll}
                  disabled={unenrolling}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {unenrolling ? 'Desmatriculando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desativar conta */}
      <div className="pt-2">
        {!confirmDeactivate ? (
          <button
            onClick={() => setConfirmDeactivate(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Desativar conta
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium text-center">
              Confirmar desativação de {studentName}?
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 text-center">
              O aluno perderá acesso ao sistema{enrollmentId != null ? ' e a matrícula ativa será cancelada' : ''}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deactivating ? 'Desativando...' : 'Confirmar desativação'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
