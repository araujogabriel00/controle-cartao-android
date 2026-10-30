import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCash } from '@/test/seeds';

describe('Início', () => {
  it('resume saldo, fatura e lançamentos recentes', async () => {
    const { screen } = await openApp('#/', async (s) => {
      await withCash(s);
      const b = (await s.createBenefit({ name: 'VR', amount: 500, firstMonth: '2026-10' })) as { id: number };
      await s.createBenefitSpend(b.id, null, { description: 'Almoço', amount: 35, date: '2026-10-10' });
    });
    expect(plain((await screen.findByTestId('text-home-balance')).textContent)).toContain('R$ 1.850,00');
    expect(plain(screen.getByTestId('text-home-invoice').textContent)).toContain('R$ 100,00');
    expect(plain(screen.getByTestId('text-home-benefits').textContent)).toContain('R$ 465,00');
    const recent = screen.getByTestId('list-home-recent');
    for (const text of ['Almoço', 'Mercado', 'Lanche']) expect(recent).toHaveTextContent(text);
  });

  it('o olho esconde os valores e mostra de novo', async () => {
    const { user, screen } = await openApp('#/', withCash);
    await screen.findByTestId('text-home-balance');
    await user.click(screen.getByTestId('button-hide-values'));
    expect(screen.getByTestId('text-home-balance')).toHaveTextContent('••••');
    expect(screen.getByTestId('text-home-balance')).not.toHaveTextContent('1.850');
    await user.click(screen.getByTestId('button-hide-values'));
    expect(plain(screen.getByTestId('text-home-balance').textContent)).toContain('R$ 1.850,00');
  });

  it('os atalhos levam às áreas', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCash);
    await user.click(await screen.findByTestId('shortcut-cards'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  it('um mês anterior mantém o Início no mês escolhido', async () => {
    const { user, screen, waitFor } = await openApp('#/', async (s) => {
      await withCash(s);
      await s.createDailyExpense(null, { description: 'Antigo', amount: 10, date: '2026-09-02' });
    });
    await user.click(await screen.findByTestId('button-previous-month'));
    await waitFor(() => expect(window.location.hash).toBe('#/inicio/mes/2026-09'));
  });
});
