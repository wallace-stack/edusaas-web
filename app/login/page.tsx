'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Building2, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import api, { registerApi } from '../lib/api';
import { setAuth, getDashboardRoute } from '../lib/auth';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface School {
  id: number;
  name: string;
}

type Step = 'credentials' | 'select-school';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dados do passo 1 guardados para o passo 2
  const [schools, setSchools] = useState<School[]>([]);
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);
  const [selectingSchoolId, setSelectingSchoolId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // ── Passo 1: e-mail + senha ──────────────────────────────────────────────
  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');
      setLoadingMsg('');
      slowTimerRef.current = setTimeout(() => {
        setLoadingMsg('Aguardando o servidor acordar… isso pode levar até 30 segundos na primeira vez.');
      }, 8_000);

      const response = await registerApi.post('/auth/login', data);

      // Usuário vinculado a várias escolas com a mesma senha → passo 2
      if (response.data.requiresSchoolSelection) {
        setSchools(response.data.schools);
        setPendingCreds(data);
        setStep('select-school');
        return;
      }

      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      const status = err.response?.status;
      if (!err.response || err.code === 'ECONNABORTED') {
        setError('Servidor acordando… aguarde 10 segundos e tente novamente.');
      } else if (status === 401) {
        setError('E-mail ou senha incorretos.');
      } else if (status === 403) {
        setError('Usuário inativo. Entre em contato com o suporte.');
      } else {
        setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
      setLoadingMsg('');
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    }
  };

  // ── Passo 2: seleção de escola ───────────────────────────────────────────
  const handleSelectSchool = async (schoolId: number) => {
    if (!pendingCreds) return;
    try {
      setSelectingSchoolId(schoolId);
      setError('');

      const response = await registerApi.post('/auth/login/select-school', {
        ...pendingCreds,
        schoolId,
      });

      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      const status = err.response?.status;
      if (!err.response || err.code === 'ECONNABORTED') {
        setError('Servidor acordando… aguarde 10 segundos e tente novamente.');
      } else if (status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setStep('credentials');
      } else {
        setError(err.response?.data?.message || 'Erro ao selecionar escola. Tente novamente.');
      }
    } finally {
      setSelectingSchoolId(null);
    }
  };

  // ── Layout externo (compartilhado pelos dois passos) ─────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>

      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50 }}>
        <ThemeToggle />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>

        {/* ── Logo (sempre visível) ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/"><img src="/logo.png" alt="Walladm" style={{ height: '96px', width: 'auto', margin: '0 auto 12px' }} className="hover:opacity-80 transition-opacity cursor-pointer" /></Link>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {step === 'credentials' ? 'Entre com sua conta' : 'Selecione a escola que deseja acessar'}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PASSO 1 — Formulário de credenciais
        ════════════════════════════════════════════════════════════════ */}
        {step === 'credentials' && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* E-mail */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={`themed-input${errors.email ? ' error' : ''}`}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Senha</label>
                <a href="/recuperar-senha" style={{ fontSize: '12px', color: '#F97316', textDecoration: 'none', fontWeight: 500 }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
                  Esqueceu a senha?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`themed-input${errors.password ? ' error' : ''}`}
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Erro geral */}
            {error && (
              <div style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error)',
                fontSize: '13px',
                padding: '12px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <AlertCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(59,130,246,0.6)' : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                color: 'white',
                padding: '13px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.15s ease',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Entrando...</>
              ) : 'Entrar'}
            </button>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {loadingMsg && (
              <p style={{ fontSize: '13px', color: '#F97316', textAlign: 'center', margin: '0' }}>
                ⏳ {loadingMsg}
              </p>
            )}
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PASSO 2 — Seleção de escola
        ════════════════════════════════════════════════════════════════ */}
        {step === 'select-school' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Lista de escolas */}
            {schools.map((school) => {
              const isLoading = selectingSchoolId === school.id;
              return (
                <button
                  key={school.id}
                  onClick={() => handleSelectSchool(school.id)}
                  disabled={selectingSchoolId !== null}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    cursor: selectingSchoolId !== null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                    opacity: selectingSchoolId !== null && !isLoading ? 0.5 : 1,
                  }}
                  onMouseOver={e => {
                    if (selectingSchoolId === null) {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                    }
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isLoading
                      ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)'
                      : 'rgba(59,130,246,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s ease',
                  }}>
                    {isLoading
                      ? <Loader2 size={18} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                      : <Building2 size={18} color="#3B82F6" />
                    }
                  </div>

                  {/* Nome da escola */}
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    flex: 1,
                    lineHeight: 1.3,
                  }}>
                    {school.name}
                  </span>
                </button>
              );
            })}

            {/* Erro */}
            {error && (
              <div style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error)',
                fontSize: '13px',
                padding: '12px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '4px',
              }}>
                <AlertCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Voltar */}
            <button
              onClick={() => { setStep('credentials'); setError(''); }}
              disabled={selectingSchoolId !== null}
              style={{
                marginTop: '4px',
                background: 'none',
                border: 'none',
                cursor: selectingSchoolId !== null ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ChevronLeft size={15} /> Usar outro e-mail
            </button>
          </div>
        )}

        {/* Rodapé — só no passo 1 */}
        {step === 'credentials' && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Não tem conta?{' '}
              <a href="/cadastro" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
                Cadastrar escola
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
