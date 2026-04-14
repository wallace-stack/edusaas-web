/**
 * Fluxo 1 — Cadastro de escola → login automático → dashboard abre
 *
 * Valida que:
 * - O formulário de cadastro aceita dados válidos
 * - O backend cria escola + diretor e retorna JWT
 * - O frontend redireciona para /dashboard/diretor
 * - O dashboard exibe o nome do diretor cadastrado
 */

import { test, expect } from '@playwright/test';
import { gerarCNPJ } from './helpers';

test.describe('Fluxo 1 — Cadastro de escola', () => {

  test('cadastro completo redireciona para dashboard do diretor', async ({ page }) => {
    const ts          = Date.now();
    const cnpj        = gerarCNPJ();
    const schoolEmail = `escola${ts}@teste.com.br`;
    const dirEmail    = `diretor${ts}@teste.com.br`;
    const dirName     = 'Diretor Teste';

    await page.goto('/cadastro');
    await expect(page.getByText('Cadastrar Escola')).toBeVisible();

    // ── Dados da escola ──────────────────────────────────────────
    await page.fill('input[placeholder="Ex: Colégio São Paulo"]', `Escola Teste ${ts}`);

    // CNPJ — campo controlado com máscara, precisa de fill direto no input
    await page.fill('input[placeholder="00.000.000/0000-00"]', cnpj);

    await page.fill('input[placeholder="contato@escola.com.br"]', schoolEmail);

    // ── Dados do diretor ─────────────────────────────────────────
    await page.fill('input[placeholder="João da Silva"]', dirName);
    await page.fill('input[placeholder="diretor@escola.com.br"]', dirEmail);
    await page.fill('input[placeholder="Mínimo 8 caracteres"]', 'Senha@2026');

    // ── Submit ───────────────────────────────────────────────────
    await page.click('button[type="submit"]');

    // Aguarda redirect para o dashboard do diretor
    await page.waitForURL(/\/dashboard\/diretor/, { timeout: 20_000 });

    // Dashboard carregou
    await expect(page.getByText(/Bom dia|Boa tarde|Boa noite/)).toBeVisible({ timeout: 10_000 });

    // Nome do diretor aparece no header
    await expect(page.getByText(dirName.split(' ')[0])).toBeVisible();
  });

  test('e-mail duplicado exibe mensagem de erro', async ({ page }) => {
    await page.goto('/cadastro');

    await page.fill('input[placeholder="Ex: Colégio São Paulo"]', 'Escola Duplicada');
    await page.fill('input[placeholder="00.000.000/0000-00"]', gerarCNPJ());
    await page.fill('input[placeholder="contato@escola.com.br"]', 'contato@duplicada.com');
    await page.fill('input[placeholder="João da Silva"]', 'Diretor Existente');

    // Usa e-mail do demo (já cadastrado)
    await page.fill('input[placeholder="diretor@escola.com.br"]', 'erikacarolinajunqueiradasilva@gmail.com');
    await page.fill('input[placeholder="Mínimo 8 caracteres"]', 'Senha@2026');

    await page.click('button[type="submit"]');

    // Deve mostrar erro de conflito (sem redirecionar)
    await expect(page.getByText(/já cadastrado/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/cadastro/);
  });

});
