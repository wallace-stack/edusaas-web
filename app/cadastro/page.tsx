'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Loader2,
  Building2, FileText, Phone, User, Tag,
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

/* ── CUPOM ────────────────────────────────────── */
function maskCupom(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  escola: 'Escola',
  rede: 'Rede',
};

type CouponInfo = { durationDays: number; targetPlan: string };

function descreverCupom(info: CouponInfo): string {
  const meses = Math.round(info.durationDays / 30);
  const plano = PLAN_LABELS[info.targetPlan] || info.targetPlan;
  return `plano ${plano} por ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

/* ── SCHEMA ───────────────────────────────────────────────────────────────
 * Toda z.string() leva { error } próprio: sem isso, um valor ausente ou do
 * tipo errado cai na mensagem crua do zod ("Invalid input: expected string,
 * received undefined"), que não diz nada útil pra quem preenche o formulário.
 *
 * Vazio e mal preenchido são erros diferentes: .min(1, "Informe X") pega o
 * vazio antes do check seguinte avaliar formato/tamanho, então a mensagem
 * certa aparece pra cada caso (zod roda os checks em ordem e reporta o
 * primeiro que falha — só o .email()/.min(3), sozinho, não saberia dizer se
 * "" era ausência ou formato errado). Mensagem de "Informe X" repete o texto
 * do label na tela, igual ao que a pessoa acabou de ler.
 */
const registerSchema = z.object({
  schoolName:    z.string({ error: 'Informe o nome da escola.' })
                   .min(1, 'Informe o nome da escola.')
                   .min(3, 'Nome da escola deve ter ao menos 3 caracteres'),
  cnpj:          z.string({ error: 'CNPJ inválido.' }).optional()
                   .refine(v => !v || validarCNPJ(v), 'CNPJ inválido, verifique os dígitos'),
  schoolEmail:   z.string({ error: 'Informe o e-mail da escola.' })
                   .min(1, 'Informe o e-mail da escola.')
                   .email('E-mail inválido'),
  directorName:  z.string({ error: 'Informe o nome completo.' })
                   .min(1, 'Informe o nome completo.')
                   .min(3, 'Nome deve ter ao menos 3 caracteres'),
  directorEmail: z.string({ error: 'Informe o e-mail de acesso.' })
                   .min(1, 'Informe o e-mail de acesso.')
                   .email('E-mail inválido'),
  password:      z.string({ error: 'Informe a senha.' })
                   .min(1, 'Informe a senha.')
                   .min(8,'Senha deve ter no mínimo 8 caracteres')
                   .regex(/[A-Z]/,'Deve ter ao menos uma maiúscula')
                   .regex(/[0-9]/,'Deve ter ao menos um número'),
  phone:         z.string({ error: 'Telefone inválido.' }).optional()
                   .refine(v => !v || v.replace(/\D/g,'').length >= 10,'Telefone inválido'),
  couponCode:    z.string({ error: 'Cupom inválido.' }).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

/* ── FIELD HELPER ─────────────────────────────── */
function FieldIcon({ icon: Icon, error, success, children }: { icon: React.ElementType; error?: string; success?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }} />
      {children}
      {success && !error && (
        <CheckCircle2 size={15} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', pointerEvents: 'none' }} />
      )}
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
function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [cnpjVal, setCnpjVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  // Lazy initializer: roda de forma síncrona no primeiro render, então o campo já
  // nasce preenchido — nunca chega a pintar vazio pra só depois (via useEffect, um
  // tick mais tarde) receber o valor da URL.
  const [couponVal, setCouponVal] = useState(() => maskCupom(searchParams.get('cupom') || ''));
  // Fixado no valor do primeiro render (sem setter usado depois): diz se a pessoa
  // chegou pelo link com cupom, pra decidir o texto enquanto o código ainda não
  // terminou de validar — sem isso, botão/subtítulo mostravam "14 dias grátis" por
  // uma fração de segundo antes de trocar pro plano, porque couponStatus começa
  // 'idle' até o efeito de validação (mais abaixo) responder.
  const [couponFromUrl] = useState(() => !!searchParams.get('cupom'));
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState('');
  const couponRequestId = useRef(0);

  const { register, handleSubmit, setValue, formState: { errors, touchedFields, isSubmitted } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  // zodResolver valida o schema INTEIRO a cada blur, não só o campo tocado — sem
  // essa checagem, blurar um campo (inclusive por auto-avanço, ver onChange do CNPJ
  // e do telefone) populava "errors" pra campos que a pessoa nem chegou a tocar
  // ainda. Só mostra erro/sucesso de um campo se ELE MESMO foi tocado, ou depois de
  // uma tentativa de envio (isSubmitted cobre os campos controlados manualmente,
  // que o react-hook-form nem sabe que existem até o primeiro setValue).
  const shouldShowValidation = (field: keyof RegisterForm) => !!touchedFields[field] || isSubmitted;

  // Link pronto de entrega (/cadastro?cupom=CODIGO): couponVal já nasce preenchido
  // (lazy initializer acima), isso só espelha o valor inicial pro react-hook-form.
  // O efeito de validação do cupom (mais abaixo, dependente de couponVal) dispara
  // sozinho e confere o código como se a pessoa tivesse digitado.
  useEffect(() => {
    if (couponFromUrl) setValue('couponCode', couponVal, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs pra foco automático (Enter avança pro próximo campo; CNPJ e telefone também
  // avançam sozinhos ao completar a máscara, ver onChange de cada um).
  const cnpjRef = useRef<HTMLInputElement>(null);
  const schoolEmailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const couponRef = useRef<HTMLInputElement>(null);
  const directorNameRef = useRef<HTMLInputElement>(null);
  const directorEmailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function focusNextOnEnter(nextRef: React.RefObject<HTMLInputElement | null>) {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nextRef.current?.focus();
      }
    };
  }

  // Campos com ref próprio (auto-foco), mas registrados via react-hook-form: precisa
  // mesclar o ref do register() com o nosso, senão um dos dois é sobrescrito.
  const { ref: schoolEmailRHFRef, ...schoolEmailField } = register('schoolEmail');
  const { ref: directorNameRHFRef, ...directorNameField } = register('directorName');
  const { ref: directorEmailRHFRef, ...directorEmailField } = register('directorEmail');
  const { ref: passwordRHFRef, ...passwordField } = register('password');

  // Validação inline do cupom: confere plano e duração no backend sem consumi-lo
  // (endpoint dedicado de preview, ver auth.controller.ts). Debounce evita bater a
  // API a cada tecla — 7 chars é o menor código real (ex.: WADM-1).
  useEffect(() => {
    const code = couponVal.trim();
    // Abaixo de 6 chars não existe código real (o menor formato é algo como
    // "WADM-1"): evita mostrar "inválido" enquanto a pessoa ainda está digitando.
    if (code.length < 6) {
      setCouponStatus('idle');
      setCouponInfo(null);
      setCouponError('');
      return;
    }

    setCouponStatus('checking');
    const requestId = ++couponRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const response = await registerApi.post('/auth/coupon-preview', { code });
        if (couponRequestId.current !== requestId) return;
        setCouponInfo(response.data);
        setCouponStatus('valid');
        setCouponError('');
      } catch (err: any) {
        if (couponRequestId.current !== requestId) return;
        setCouponInfo(null);
        setCouponStatus('invalid');
        setCouponError(err?.response?.data?.message || 'Cupom inválido ou já utilizado.');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [couponVal]);

  const onSubmit = async (data: RegisterForm) => {
    // Cupom digitado mas ainda não confirmado como válido: não deixa seguir pro
    // registro, senão o backend derruba o cadastro inteiro (ver auth.service.ts) e
    // quem pagou pelo combo vê um erro genérico sem entender o motivo.
    if (couponVal.trim() && couponStatus !== 'valid') {
      setError('Confira o código do cupom antes de continuar, ele ainda não foi validado.');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingMsg('');

    // Após 5s sem resposta, avisa sobre cold start do servidor
    const slowTimer = setTimeout(() => {
      setLoadingMsg('Aguardando o servidor acordar… isso pode levar até 30 segundos na primeira vez.');
    }, 5_000);

    try {
      const payload = {
        ...data,
        cnpj: data.cnpj?.replace(/\D/g,'') || undefined,
        phone: data.phone?.replace(/\D/g,'') || undefined,
        couponCode: couponVal.trim() || undefined,
      };
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

  // paddingRight sempre reservado pro ícone de sucesso/erro (FieldIcon), pra não
  // deslocar o layout quando o status muda enquanto a pessoa digita.
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    paddingLeft: '40px',
    paddingRight: '40px',
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
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {couponStatus === 'valid' && couponInfo
              ? `Cupom aplicado, ${descreverCupom(couponInfo)}`
              : couponFromUrl && couponStatus !== 'invalid'
                ? 'Confirmando cupom…'
                : '14 dias grátis, sem cartão de crédito'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Dados da escola */}
          <SectionCard title="Dados da escola">

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Nome da escola</label>
              <FieldIcon icon={Building2} error={shouldShowValidation('schoolName') ? errors.schoolName?.message : undefined} success={shouldShowValidation('schoolName') && !errors.schoolName}>
                <input {...register('schoolName')} placeholder="Ex: Colégio São Paulo"
                  onKeyDown={focusNextOnEnter(cnpjRef)}
                  className={`themed-input${shouldShowValidation('schoolName') ? (errors.schoolName ? ' error' : ' success') : ''}`}
                  style={inputStyle(shouldShowValidation('schoolName') && !!errors.schoolName)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>CNPJ <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span></label>
              <FieldIcon icon={FileText} error={cnpjVal.length > 0 ? errors.cnpj?.message : undefined} success={cnpjVal.length > 0 && !errors.cnpj}>
                <input ref={cnpjRef} value={cnpjVal}
                  onChange={e => {
                    const m = maskCNPJ(e.target.value);
                    setCnpjVal(m);
                    setValue('cnpj', m, { shouldValidate: true });
                    // Máscara completa (14 dígitos) e válida — avança sozinho, sem esperar Enter/Tab
                    if (m.length === 18 && validarCNPJ(m)) schoolEmailRef.current?.focus();
                  }}
                  onKeyDown={focusNextOnEnter(schoolEmailRef)}
                  placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18}
                  className={`themed-input${cnpjVal.length > 0 ? (errors.cnpj ? ' error' : ' success') : ''}`}
                  style={inputStyle(cnpjVal.length > 0 && !!errors.cnpj)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>E-mail da escola</label>
              <FieldIcon icon={Mail} error={shouldShowValidation('schoolEmail') ? errors.schoolEmail?.message : undefined} success={shouldShowValidation('schoolEmail') && !errors.schoolEmail}>
                <input {...schoolEmailField} ref={(el) => { schoolEmailRHFRef(el); schoolEmailRef.current = el; }}
                  type="email" autoComplete="off" placeholder="contato@escola.com.br"
                  onKeyDown={focusNextOnEnter(phoneRef)}
                  className={`themed-input${shouldShowValidation('schoolEmail') ? (errors.schoolEmail ? ' error' : ' success') : ''}`}
                  style={inputStyle(shouldShowValidation('schoolEmail') && !!errors.schoolEmail)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Telefone <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span></label>
              <FieldIcon icon={Phone} error={phoneVal.length > 0 ? errors.phone?.message : undefined} success={phoneVal.length > 0 && !errors.phone}>
                <input ref={phoneRef} value={phoneVal}
                  onChange={e => {
                    const m = maskPhone(e.target.value);
                    setPhoneVal(m);
                    setValue('phone', m, { shouldValidate: true });
                    // Celular completo (11 dígitos) — avança sozinho
                    if (m.replace(/\D/g, '').length === 11) couponRef.current?.focus();
                  }}
                  onKeyDown={focusNextOnEnter(couponRef)}
                  placeholder="(11) 99999-9999" inputMode="numeric" maxLength={15}
                  className={`themed-input${phoneVal.length > 0 ? (errors.phone ? ' error' : ' success') : ''}`}
                  style={inputStyle(phoneVal.length > 0 && !!errors.phone)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Cupom promocional <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span></label>
              <div style={{ position: 'relative' }}>
                <Tag size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  ref={couponRef}
                  value={couponVal}
                  onChange={e => { const m = maskCupom(e.target.value); setCouponVal(m); setValue('couponCode', m, { shouldValidate: true }); }}
                  onKeyDown={focusNextOnEnter(directorNameRef)}
                  placeholder="Ex: WADM-1234-5678" autoCapitalize="characters" maxLength={20}
                  className={`themed-input${couponStatus === 'invalid' ? ' error' : ''}${couponStatus === 'valid' ? ' success' : ''}`}
                  style={{ ...inputStyle(couponStatus === 'invalid'), paddingRight: '40px' }}
                />
                {couponStatus === 'checking' && (
                  <Loader2 size={15} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />
                )}
                {couponStatus === 'valid' && (
                  <CheckCircle2 size={15} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }} />
                )}
              </div>
              {couponStatus === 'invalid' && (
                <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {couponError}
                </p>
              )}
              {couponStatus === 'valid' && couponInfo && (
                <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Cupom válido: {descreverCupom(couponInfo)}, ativado assim que o cadastro for enviado.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Dados do diretor */}
          <SectionCard title="Dados do diretor">

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Nome completo</label>
              <FieldIcon icon={User} error={shouldShowValidation('directorName') ? errors.directorName?.message : undefined} success={shouldShowValidation('directorName') && !errors.directorName}>
                <input {...directorNameField} ref={(el) => { directorNameRHFRef(el); directorNameRef.current = el; }}
                  placeholder="João da Silva" autoComplete="name"
                  onKeyDown={focusNextOnEnter(directorEmailRef)}
                  className={`themed-input${shouldShowValidation('directorName') ? (errors.directorName ? ' error' : ' success') : ''}`}
                  style={inputStyle(shouldShowValidation('directorName') && !!errors.directorName)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>E-mail de acesso</label>
              <FieldIcon icon={Mail} error={shouldShowValidation('directorEmail') ? errors.directorEmail?.message : undefined} success={shouldShowValidation('directorEmail') && !errors.directorEmail}>
                <input {...directorEmailField} ref={(el) => { directorEmailRHFRef(el); directorEmailRef.current = el; }}
                  type="email" autoComplete="email" placeholder="diretor@escola.com.br"
                  onKeyDown={focusNextOnEnter(passwordRef)}
                  className={`themed-input${shouldShowValidation('directorEmail') ? (errors.directorEmail ? ' error' : ' success') : ''}`}
                  style={inputStyle(shouldShowValidation('directorEmail') && !!errors.directorEmail)} />
              </FieldIcon>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input {...passwordField} ref={(el) => { passwordRHFRef(el); passwordRef.current = el; }}
                  type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                  className={`themed-input${shouldShowValidation('password') ? (errors.password ? ' error' : ' success') : ''}`}
                  style={{ paddingLeft: '40px', paddingRight: '76px' }} />
                {shouldShowValidation('password') && !errors.password && (
                  <CheckCircle2 size={15} style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', pointerEvents: 'none' }} />
                )}
                <button type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {shouldShowValidation('password') && errors.password ? (
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
          {/* Confirmando cupom da URL conta como "ainda checando", mesmo antes do
              efeito de validação marcar couponStatus como 'checking' de fato. */}
          <button type="submit" disabled={loading || couponStatus === 'checking' || (couponFromUrl && couponStatus === 'idle')} style={{
            width: '100%',
            background: (loading || couponStatus === 'checking' || (couponFromUrl && couponStatus === 'idle')) ? 'rgba(249,115,22,0.6)' : '#F97316',
            color: 'white', padding: '13px', borderRadius: '12px', fontWeight: 600,
            fontSize: '14px', border: 'none', cursor: (loading || couponStatus === 'checking' || (couponFromUrl && couponStatus === 'idle')) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'opacity 0.15s ease',
            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
          }}>
            {loading ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cadastrando...</>
            ) : couponStatus === 'valid' && couponInfo ? (
              `Ativar ${descreverCupom(couponInfo)}`
            ) : couponFromUrl && couponStatus !== 'invalid' ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Confirmando cupom...</>
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

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroForm />
    </Suspense>
  );
}
