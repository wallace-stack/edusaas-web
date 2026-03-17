'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { setAuth } from '../lib/auth';

const registerSchema = z.object({
  schoolName: z.string().min(3, 'Nome da escola obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  schoolEmail: z.string().email('Email inválido'),
  directorName: z.string().min(3, 'Nome do diretor obrigatório'),
  directorEmail: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/register', data);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push('/dashboard/diretor');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar escola');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Cadastrar Escola</h1>
          <p className="text-gray-500 text-sm mt-1">14 dias grátis — sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados da escola</p>

            <div>
              <input
                {...register('schoolName')}
                placeholder="Nome da escola"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.schoolName && <p className="text-red-500 text-xs mt-1">{errors.schoolName.message}</p>}
            </div>

            <div>
              <input
                {...register('cnpj')}
                placeholder="CNPJ"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
            </div>

            <div>
              <input
                {...register('schoolEmail')}
                type="email"
                placeholder="Email da escola"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.schoolEmail && <p className="text-red-500 text-xs mt-1">{errors.schoolEmail.message}</p>}
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados do diretor</p>

            <div>
              <input
                {...register('directorName')}
                placeholder="Nome completo"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.directorName && <p className="text-red-500 text-xs mt-1">{errors.directorName.message}</p>}
            </div>

            <div>
              <input
                {...register('directorEmail')}
                type="email"
                placeholder="Email de acesso"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.directorEmail && <p className="text-red-500 text-xs mt-1">{errors.directorEmail.message}</p>}
            </div>

            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="Senha"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] text-white py-3 rounded-xl font-medium hover:bg-[#ea6c0a] transition-colors disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Começar 14 dias grátis'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já tem conta?{' '}
            <a href="/login" className="text-[#1E3A5F] font-medium hover:underline">
              Entrar
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}