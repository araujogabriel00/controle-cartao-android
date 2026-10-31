import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCash } from '@/test/seeds';

describe('Resumo do mês', () => {
  it('mostra saldo anterior, resultado e as quatro origens', async () => {
    const { screen } = await openApp('#/entradas/resumo', withCash);
    expect(plain((await screen.findByTestId('text-cash-result')).textContent)).toContain('R$ 1.850,00');
    expect(plain(screen.getByTestId('text-cash-previous').textContent)).toContain('R$ 0,00');
    expect(screen.getByTestId('text-cash-income')).toHaveTextContent('3.000,00');
    expect(screen.getByTestId('text-cash-bills')).toHaveTextContent('1.000,00');
    expect(screen.getByTestId('text-cash-daily')).toHaveTextContent('50,00');
    expect(screen.getByTestId('text-cash-cards')).toHaveTextContent('100,00');
  });

  it('o saldo anterior traz o resultado do mês passado', async () => {
    const { screen } = await openApp('#/entradas/resumo', async (s) => {
      await withCash(s);
      await s.createDailyExpense(null, { description: 'Antigo', amount: 200, date: '2026-09-02' });
    });
    expect(await screen.findByTestId('text-cash-previous')).toHaveTextContent('200,00');
  });

  it('chega pelo botão Resumo de Entradas', async () => {
    const { user, screen, waitFor } = await openApp('#/entradas', withCash);
    await user.click(await screen.findByTestId('button-summary'));
    await waitFor(() => expect(window.location.hash).toBe('#/entradas/resumo'));
    await screen.findByTestId('text-cash-result');
  });

  it('mês inválido volta ao resumo do mês atual', async () => {
    const { waitFor } = await openApp('#/entradas/resumo/mes/lixo', withCash);
    await waitFor(() => expect(window.location.hash).toBe('#/entradas/resumo'));
  });
});
