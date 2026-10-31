import { describe, expect, it } from 'vitest';
import { openApp } from '@/test/app';
import { withHistory } from '@/test/seeds';

describe('Histórico', () => {
  it('lista as faturas de cada mês e as parcelas dos próximos', async () => {
    const { screen } = await openApp('#/historico', withHistory);
    expect(await screen.findByTestId('card-month-2026-10')).toHaveTextContent(/2 compras.*200,00/);
    expect(screen.getByTestId('card-month-2026-09')).toHaveTextContent(/1 compra.*70,00/);
    expect(screen.getByTestId('row-upcoming-2026-11')).toHaveTextContent(/1 item.*100,00/);
    expect(screen.getByTestId('row-upcoming-2026-12')).toHaveTextContent('100,00');
  });

  it('abrir um mês leva ao painel dele', async () => {
    const { user, screen, waitFor } = await openApp('#/historico', withHistory);
    await user.click(await screen.findByTestId('card-month-2026-09'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes/mes/2026-09'));
    expect(await screen.findByTestId('text-month')).toHaveTextContent(/setembro de 2026/i);
  });

  it('abrir um mês previsto leva ao painel dele', async () => {
    const { user, screen, waitFor } = await openApp('#/historico', withHistory);
    await user.click(await screen.findByTestId('row-upcoming-2026-11'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes/mes/2026-11'));
  });
});
