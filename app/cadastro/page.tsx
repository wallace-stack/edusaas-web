'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { setAuth, getDashboardRoute } from '../lib/auth';

// ─── Validação de CNPJ com dígitos verificadores ───────────────────────────
function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1+$/.test(nums)) return false; // bloqueia 00000000000000 etc.

  const calc = (n: string, len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(n[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calc(nums, 12);
  const d2 = calc(nums, 13);
  return d1 === parseInt(nums[12]) && d2 === parseInt(nums[13]);
}

// ─── Máscaras ──────────────────────────────────────────────────────────────
function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
}

// ─── Schema Zod ───────────────────────────────────────────────────────────
const registerSchema = z.object({
  schoolName: z.string().min(3, 'Nome da escola deve ter ao menos 3 caracteres'),
  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine(v => validarCNPJ(v), 'CNPJ inválido — verifique os dígitos'),
  schoolEmail: z.string().email('E-mail inválido'),
  directorName: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  directorEmail: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número'),
  phone: z
    .string()
    .optional()
    .refine(v => !v || v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
});

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Componente de campo com label e erro ─────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Estilo base dos inputs ────────────────────────────────────────────────
function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white
    ${hasError
      ? 'border-red-400 focus:ring-red-300 bg-red-50'
      : 'border-gray-200 focus:ring-[#1E3A5F]'
    }`;
}

// ─── Página ───────────────────────────────────────────────────────────────
export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [cnpjVal, setCnpjVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError('');

      // Envia CNPJ apenas com números para a API
      const payload = {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, '') || undefined,
      };

      const response = await api.post('/auth/register', payload);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setError('E-mail ou CNPJ já cadastrado. Tente fazer login.');
      } else if (status === 400) {
        setError('Verifique os dados informados e tente novamente.');
      } else {
        setError(err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-lg p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Cadastrar Escola</h1>
          <p className="text-gray-500 text-sm mt-1">14 dias grátis — sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* ── Dados da escola ── */}
          <div className="bg-[#F8FAFC] rounded-2xl p-5 space-y-4 border border-gray-100">
            <p className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest">
              Dados da escola
            </p>

            <Field label="Nome da escola" error={errors.schoolName?.message}>
              <input
                {...register('schoolName')}
                placeholder="Ex: Colégio São Paulo"
                className={inputClass(!!errors.schoolName)}
              />
            </Field>

            <Field label="CNPJ" error={errors.cnpj?.message}>
              <input
                value={cnpjVal}
                onChange={e => {
                  const masked = maskCNPJ(e.target.value);
                  setCnpjVal(masked);
                  setValue('cnpj', masked, { shouldValidate: true });
                }}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                maxLength={18}
                className={inputClass(!!errors.cnpj)}
              />
            </Field>

            <Field label="E-mail da escola" error={errors.schoolEmail?.message}>
              <input
                {...register('schoolEmail')}
                type="email"
                autoComplete="off"
                placeholder="contato@escola.com.br"
                className={inputClass(!!errors.schoolEmail)}
              />
            </Field>

            <Field label="Telefone (opcional)" error={errors.phone?.message}>
              <input
                value={phoneVal}
                onChange={e => {
                  const masked = maskPhone(e.target.value);
                  setPhoneVal(masked);
                  setValue('phone', masked, { shouldValidate: true });
                }}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                maxLength={15}
                className={inputClass(!!errors.phone)}
              />
            </Field>
          </div>

          {/* ── Dados do diretor ── */}
          <div className="bg-[#F8FAFC] rounded-2xl p-5 space-y-4 border border-gray-100">
            <p className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest">
              Dados do diretor
            </p>

            <Field label="Nome completo" error={errors.directorName?.message}>
              <input
                {...register('directorName')}
                placeholder="João da Silva"
                autoComplete="name"
                className={inputClass(!!errors.directorName)}
              />
            </Field>

            <Field label="E-mail de acesso" error={errors.directorEmail?.message}>
              <input
                {...register('directorEmail')}
                type="email"
                autoComplete="email"
                placeholder="diretor@escola.com.br"
                className={inputClass(!!errors.directorEmail)}
              />
            </Field>

            <Field label="Senha" error={errors.password?.message}>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className={inputClass(!!errors.password) + ' pr-12'}
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
              <p className="text-xs text-gray-400 mt-1">
                Mínimo 8 caracteres, uma maiúscula e um número.
              </p>
            </Field>
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
                Cadastrando...
              </>
            ) : 'Começar 14 dias grátis'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já tem conta?{' '}
            <a href="/login" className="text-[#1E3A5F] font-semibold hover:underline">
              Entrar
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
