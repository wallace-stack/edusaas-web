'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerApi } from '../lib/api';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      setLoading(true);
      setError('');
      await registerApi.post('/auth/forgot-password', data);
      setSent(true);
    } catch {
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Walladm</h1>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">E-mail enviado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha em breve. Verifique também a pasta de spam.
            </p>
            <a
              href="/login"
              className="text-[#1E3A5F] font-semibold hover:underline text-sm"
            >
              ← Voltar para o login
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Recuperar senha</h2>
              <p className="text-gray-500 text-sm">
                Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  E-mail cadastrado
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${errors.email
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-gray-200 focus:ring-[#1E3A5F]'
                    }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
                  <span>⚠</span> <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-semibold
                  hover:bg-[#162d4a] active:scale-[0.98] transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Enviando...
                  </>
                ) : 'Enviar link de recuperação'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/login" className="text-sm text-[#1E3A5F] font-semibold hover:underline">
                ← Voltar para o login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}