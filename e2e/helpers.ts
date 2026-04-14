import { Page } from '@playwright/test';

export const DEMO_TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'ana.lima@horizonte.com';
export const DEMO_TEACHER_PASS  = process.env.TEACHER_PASS  || 'Horizonte@2026';
export const DEMO_DIR_EMAIL     = process.env.DIR_EMAIL     || 'erikacarolinajunqueiradasilva@gmail.com';
export const DEMO_DIR_PASS      = process.env.DIR_PASS      || 'Horizonte@2026';

/** Gera CNPJ válido a partir de um número base de 12 dígitos */
function calcDigito(base: string): number {
  const len = base.length;
  let sum = 0; let pos = len - 7;
  for (let i = len; i >= 1; i--) {
    sum += parseInt(base[len - i]) * pos--;
    if (pos < 2) pos = 9;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export function gerarCNPJ(): string {
  const ts = Date.now().toString().slice(-8).padStart(8, '0');
  const base = `11${ts}0001`;            // 12 dígitos
  const d1   = calcDigito(base);
  const d2   = calcDigito(base + d1);
  const raw  = `${base}${d1}${d2}`;
  return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/** Faz login e aguarda o redirect para o dashboard */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}
