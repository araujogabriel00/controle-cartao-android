import { describe, expect, it } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { withCash } from '@/test/seeds';

const withForecasts = async (s: Store) => {
  await withCash(s);
  await s.createForecast({ kind: 'receive', description: 'Freela', amount: 400, date: '2026-10-20', affects: true, recurring: false });
  await s.createForecast({ kind: 'pay', description: 'Lembrete', amount: 90, date: '2026-10-22', affects: false, recurring: false });
};

describe('Saldo previsto', () => {
  it('soma só as previsões que mexem no saldo', async () => {
    const { screen } = await openApp('#/previsoes/saldo', withForecasts);
    expect(plain((await screen.findByTestId('text-balance-forecast')).textContent)).toContain('R$ 2.250,00');
    expect(plain(screen.getByTestId('text-balance-forecast-diff').textContent)).toContain('+ R$ 400,00');
    expect(screen.getByTestId('list-forecasts')).toHaveTextContent('Freela');
  });

  it('sem previsão o saldo previsto é o de hoje', async () => {
    const { screen } = await openApp('#/previsoes/saldo', withCash);
    expect(plain((await screen.findByTestId('text-balance-forecast')).textContent)).toContain('R$ 1.850,00');
  });

  it('chega pelo link do resumo de Previsões', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withForecasts);
    await user.click(await screen.findByTestId('link-balance-forecast'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/saldo'));
  });

  it('abrir uma previsão da lista leva à tela dela', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes/saldo', withForecasts);
    const [row] = await screen.findAllByTestId(/^row-forecast-/);
    await user.click(row);
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/previsoes\/(editar|dia)\//));
  });
});
