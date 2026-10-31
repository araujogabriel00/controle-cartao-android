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

  // specs/previsoes.md RN-08/RN-09: o mês aberto dá o saldo base; o previsto soma o que ainda vai acontecer até o fim dele.
  it('em mês futuro parte do saldo do mês e soma as previsões pendentes', async () => {
    const { store, screen } = await openApp('#/previsoes/saldo/2026-11', async (s) => {
      await withForecasts(s);
      await s.createForecast({ kind: 'pay', description: 'Dentista', amount: 100, date: '2026-11-10', affects: true, recurring: false });
    });
    const november = (await store.getMonthCash('2026-11')).balanceAmount;
    // +400 (20/10, ainda por vir) −100 (10/11) sobre o saldo de novembro.
    const expected = Math.round((november + 300) * 100) / 100;
    const summary = await store.getForecastSummary('2026-11');
    const forecast = await store.getBalanceForecast('2026-11');
    expect(summary.projected).toBe(expected);
    expect(forecast.endBalance).toBe(expected);
    expect(forecast.points[0].date).toBe('2026-11-01');
    expect(forecast.points).toHaveLength(30);
    expect(forecast.points[0].balance).toBe(Math.round((november + 400) * 100) / 100);
    expect(plain((await screen.findByTestId('text-balance-forecast')).textContent)).toBe(plain(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expected)));
    expect(plain(screen.getByTestId('text-balance-forecast-diff').textContent)).toContain('ao saldo de novembro');
  });

  it('o previsto final de um mês é o saldo inicial do seguinte', async () => {
    const { store } = await openApp('#/previsoes', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'receive', description: 'Venda', amount: 1000, date: '2026-11-10', affects: true, recurring: false });
      await s.createForecast({ kind: 'pay', description: 'Seguro', amount: 200, date: '2026-12-05', affects: true, recurring: false });
    });
    const november = await store.getForecastSummary('2026-11');
    const december = await store.getForecastSummary('2026-12');
    const base = (await store.getMonthCash('2026-12')).balanceAmount;
    expect(november.projected).toBe(Math.round((november.balance + 1000) * 100) / 100);
    // O saldo de dezembro já traz os R$ 1.000 pendentes de novembro; o previsto só soma o que é de dezembro.
    expect(december.balance).toBe(Math.round((base + 1000) * 100) / 100);
    expect(december.projected).toBe(Math.round((base + 800) * 100) / 100);
    const chart = await store.getBalanceForecast('2026-12');
    expect(chart.points[0].balance).toBe(december.balance);
    expect(chart.endBalance).toBe(december.projected);
  });

  it('no exemplo de R$ 11 de saldo e R$ 1.000 a receber o previsto é R$ 1.011', async () => {
    const { store } = await openApp('#/previsoes', async (s) => {
      await s.createIncome({ kind: 'salario', amount: 11, date: '2026-10-05', recurring: false });
      await s.createForecast({ kind: 'receive', description: 'Venda', amount: 1000, date: '2026-10-25', affects: true, recurring: false });
    });
    expect(await store.getForecastSummary('2026-10')).toMatchObject({ balance: 11, projected: 1011 });
  });

  it('mês passado não tem projeção', async () => {
    const { store } = await openApp('#/previsoes', withForecasts);
    expect((await store.getForecastSummary('2026-09')).projected).toBeNull();
    expect((await store.getBalanceForecast('2026-09')).points).toEqual([]);
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
