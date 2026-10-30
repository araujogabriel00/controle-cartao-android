import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCash } from '@/test/seeds';

describe('Entradas', () => {
  it('mostra o saldo e as quatro origens do mês', async () => {
    const { screen } = await openApp('#/entradas', withCash);
    expect(plain((await screen.findByTestId('text-cash-balance')).textContent)).toContain('R$ 1.850,00');
    expect(screen.getByTestId('row-origin-income')).toHaveTextContent('3.000,00');
    expect(screen.getByTestId('row-origin-bills')).toHaveTextContent('1.000,00');
    expect(screen.getByTestId('row-origin-daily')).toHaveTextContent('50,00');
    expect(screen.getByTestId('row-origin-cards')).toHaveTextContent('100,00');
  });

  it('a lista de gastos mostra o total e o lançamento', async () => {
    const { screen } = await openApp('#/entradas/lista/gastos', withCash);
    expect(await screen.findByText('Lanche')).toBeInTheDocument();
    expect(plain(screen.getByTestId('text-list-total').textContent)).toContain('R$ 50,00');
  });

  it('abrir uma origem leva para a lista dela', async () => {
    const { user, screen, waitFor } = await openApp('#/entradas', withCash);
    await user.click(await screen.findByTestId('row-origin-daily'));
    await waitFor(() => expect(window.location.hash).toBe('#/entradas/lista/gastos'));
  });

  it('lança uma entrada pelo botão Lançar e o saldo sobe', async () => {
    const { user, screen, store } = await openApp('#/entradas', withCash);
    await user.click(await screen.findByTestId('button-quick-add'));
    await user.click(await screen.findByTestId('quick-income'));
    await user.type(await screen.findByTestId('input-income-amount'), '500');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await screen.findByText('Entrada registrada.');
    expect((await store.getMonthCash('2026-10')).incomeAmount).toBe(3500);
  });

  it('o mês anterior abre sem lançamentos do mês atual', async () => {
    const { user, screen, waitFor } = await openApp('#/entradas', async (s) => {
      await withCash(s);
      await s.createDailyExpense(null, { description: 'Antigo', amount: 10, date: '2026-09-02' });
    });
    await user.click(await screen.findByTestId('button-previous-month'));
    await waitFor(() => expect(window.location.hash).toBe('#/entradas/mes/2026-09'));
  });
});
