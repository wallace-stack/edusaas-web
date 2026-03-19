'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { setAuth, getDashboardRoute } from '../lib/auth';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/login', data);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError('E-mail ou senha incorretos.');
      } else if (status === 403) {
        setError('Usuário inativo. Entre em contato com o suporte.');
      } else {
        setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">EduSaaS</h1>
          <p className="text-gray-500 text-sm mt-1">Entre com sua conta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              E-mail
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

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Senha
              </label>
              <a
                href="/recuperar-senha"
                className="text-xs text-[#F97316] hover:underline font-medium"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:border-transparent transition-all
                  ${errors.password
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-200 focus:ring-[#1E3A5F]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1"
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.password.message}
              </p>
            )}
          </div>

          {/* Erro geral */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
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
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Não tem conta?{' '}
            <a href="/cadastro" className="text-[#F97316] font-semibold hover:underline">
              Cadastrar escola
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
