'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

function NovaSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite uma nova recuperação de senha.');
  }, [token]);

  const onSubmit = async (data: Form) => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      await api.post('/auth/reset-password', { token, password: data.password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg?.includes('expirado')) {
        setError('Link expirado. Solicite uma nova recuperação de senha.');
      } else {
        setError(msg || 'Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Senha redefinida!</h2>
          <p className="text-gray-500 text-sm">
            Sua senha foi alterada com sucesso. Redirecionando para o login...
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Nova senha</h2>
            <p className="text-gray-500 text-sm">Digite e confirme sua nova senha.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${errors.password ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-[#1E3A5F]'}`}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1" tabIndex={-1}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span> {errors.password.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, uma maiúscula e um número.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar senha</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${errors.confirmPassword ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-[#1E3A5F]'}`}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1" tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span> {errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
                <span>⚠</span>
                <div>
                  <p>{error}</p>
                  {error.includes('expirado') && (
                    <a href="/recuperar-senha" className="font-semibold underline mt-1 inline-block">
                      Solicitar novo link
                    </a>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold
                hover:bg-[#ea6c0a] active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar nova senha'}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function NovaSenhaPage() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">EduSaaS</h1>
        </div>
        <Suspense fallback={<p className="text-center text-gray-400 text-sm">Carregando...</p>}>
          <NovaSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}