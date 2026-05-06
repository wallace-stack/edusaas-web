'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Mail, Lock, AlertCircle, Loader2,
  Building2, FileText, Phone, User,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import api, { registerApi } from '../lib/api';
import { setAuth, getDashboardRoute } from '../lib/auth';

/* ── CNPJ ─────────────────────────────────────── */
function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1+$/.test(nums)) return false;
  const calc = (n: string, len: number) => {
    let sum = 0; let pos = len - 7;
    for (let i = len; i >= 1; i--) { sum += parseInt(n[len - i]) * pos--; if (pos < 2) pos = 9; }
    const r = sum % 11; return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(nums, 12); const d2 = calc(nums, 13);
  return d1 === parseInt(nums[12]) && d2 === parseInt(nums[13]);
}

function maskCNPJ(value: string): string {
  return value.replace(/\D/g,'').slice(0,14)
    .replace(/^(\d{2})(\d)/,'$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    .replace(/\.(\d{3})(\d)/,'.$1/$2')
    .replace(/(\d{4})(\d)/,'$1-$2');
}

function maskPhone(value: string): string {
  return value.replace(/\D/g,'').slice(0,11)
    .replace(/^(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d{4})$/,'$1-$2');
}

/* ── SCHEMA ───────────────────────────────────── */
const registerSchema = z.object({
  schoolName:    z.string().min(3, 'Nome da escola deve ter ao menos 3 caracteres'),
  cnpj:          z.string().min(1, 'CNPJ é obrigatório').refine(v => validarCNPJ(v), 'CNPJ inválido — verifique os dígitos'),
  schoolEmail:   z.string().email('E-mail inválido'),
  directorName:  z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  directorEmail: z.string().email('E-mail inválido'),
  password:      z.string().min(8,'Senha deve ter no mínimo 8 caracteres').regex(/[A-Z]/,'Deve ter ao menos uma maiúscula').regex(/[0-9]/,'Deve ter ao menos um número'),
  phone:         z.string().optional().refine(v => !v || v.replace(/\D/g,'').length >= 10,'Telefone inválido'),
});

type RegisterForm = z.infer<typeof registerSchema>;

/* ── FIELD HELPER ─────────────────────────────── */
function FieldIcon({ icon: Icon, error, children }: { icon: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }} />
      {children}
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ── SECTION CARD ─────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  );
}

/* ── PAGE ─────────────────────────────────────── */
export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [cnpjVal, setCnpjVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    setLoadingMsg('');

    // Após 5s sem resposta, avisa sobre cold start do servidor
    const slowTimer = setTimeout(() => {
      setLoadingMsg('Aguardando o servidor acordar… isso pode levar até 30 segundos na primeira vez.');
    }, 5_000);

    try {
      const payload = { ...data, cnpj: data.cnpj.replace(/\D/g,''), phone: data.phone?.replace(/\D/g,'') || undefined };
      const response = await registerApi.post('/auth/register', payload);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message;

      if (status === 409) {
        setError('E-mail ou CNPJ já cadastrado. Tente fazer login ou use outros dados.');
      } else if (status === 400) {
        setError(msg || 'Dados inválidos. Verifique o formulário e tente novamente.');
      } else if (err?.code === 'ECONNABORTED' || !err?.response) {
        setError('O servidor demorou para responder. Aguarde alguns segundos e tente novamente.');
      } else {
        setError(msg || 'Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    paddingLeft: '40px',
    ...(hasError ? {} : {}),
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px 40px' }}>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50 }}>
        <ThemeToggle />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/"><img src="/logo.png" alt="Walladm" style={{ height: "96px", width: "auto", margin: "0 auto 12px" }} className="hover:opacity-80 transition-opacity cursor-pointer" /></Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Cadastrar Escola</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>14 dias grátis — sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Dados da escola */}
          <SectionCard title="Dados da escola">

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Nome da escola</label>
              <FieldIcon icon={Building2} error={errors.schoolName?.message}>
                <input {...register('schoolName')} placeholder="Ex: Colégio São Paulo"
                  className={`themed-input${errors.schoolName ? ' error' : ''}`} style={inputStyle(!!errors.schoolName)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>CNPJ</label>
              <FieldIcon icon={FileText} error={errors.cnpj?.message}>
                <input value={cnpjVal} onChange={e => { const m = maskCNPJ(e.target.value); setCnpjVal(m); setValue('cnpj', m, { shouldValidate: true }); }}
                  placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18}
                  className={`themed-input${errors.cnpj ? ' error' : ''}`} style={inputStyle(!!errors.cnpj)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>E-mail da escola</label>
              <FieldIcon icon={Mail} error={errors.schoolEmail?.message}>
                <input {...register('schoolEmail')} type="email" autoComplete="off" placeholder="contato@escola.com.br"
                  className={`themed-input${errors.schoolEmail ? ' error' : ''}`} style={inputStyle(!!errors.schoolEmail)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Telefone <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span></label>
              <FieldIcon icon={Phone} error={errors.phone?.message}>
                <input value={phoneVal} onChange={e => { const m = maskPhone(e.target.value); setPhoneVal(m); setValue('phone', m, { shouldValidate: true }); }}
                  placeholder="(11) 99999-9999" inputMode="numeric" maxLength={15}
                  className={`themed-input${errors.phone ? ' error' : ''}`} style={inputStyle(!!errors.phone)} />
              </FieldIcon>
            </div>
          </SectionCard>

          {/* Dados do diretor */}
          <SectionCard title="Dados do diretor">

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Nome completo</label>
              <FieldIcon icon={User} error={errors.directorName?.message}>
                <input {...register('directorName')} placeholder="João da Silva" autoComplete="name"
                  className={`themed-input${errors.directorName ? ' error' : ''}`} style={inputStyle(!!errors.directorName)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>E-mail de acesso</label>
              <FieldIcon icon={Mail} error={errors.directorEmail?.message}>
                <input {...register('directorEmail')} type="email" autoComplete="email" placeholder="diretor@escola.com.br"
                  className={`themed-input${errors.directorEmail ? ' error' : ''}`} style={inputStyle(!!errors.directorEmail)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input {...register('password')} type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                  className={`themed-input${errors.password ? ' error' : ''}`} style={{ paddingLeft: '40px', paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? (
                <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              ) : (
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Mínimo 8 caracteres, uma maiúscula e um número.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Erro geral */}
          {error && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid var(--error-border)',
              color: 'var(--error)', fontSize: '13px', padding: '12px 14px', borderRadius: '12px',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <AlertCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: loading ? 'rgba(249,115,22,0.6)' : '#F97316',
            color: 'white', padding: '13px', borderRadius: '12px', fontWeight: 600,
            fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'opacity 0.15s ease',
            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
          }}>
            {loading ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cadastrando...</>
            ) : 'Começar 14 dias grátis'}
          </button>

          {loadingMsg && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
              ⏳ {loadingMsg}
            </p>
          )}
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
              Entrar
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
