import { describe, expect, it } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { withCash } from '@/test/seeds';

const withFreela = async (s: Store) => {
  await withCash(s);
  await s.createForecast({ kind: 'receive', description: 'Freela', amount: 400, date: '2026-10-20', affects: true, recurring: false });
};

describe('Dia de Previsões', () => {
  it('mostra o título, a previsão e o quanto mexe no saldo', async () => {
    const { screen } = await openApp('#/previsoes/dia/2026-10-20', withFreela);
    expect(await screen.findByTestId('text-day-title')).toHaveTextContent(/20 de outubro/i);
    expect(plain((await screen.findByTestId('text-day-total')).textContent)).toContain('+ R$ 400,00');
    expect(screen.getByTestId('list-forecasts')).toHaveTextContent('Freela');
  });

  it('dia sem previsão mostra o estado vazio', async () => {
    const { screen } = await openApp('#/previsoes/dia/2026-10-21', withFreela);
    expect(await screen.findByTestId('text-forecast-day-empty')).toHaveTextContent('Nada previsto para este dia.');
  });

  it('editar o valor muda só esta ocorrência', async () => {
    const { user, screen, store } = await openApp('#/previsoes/dia/2026-10-20', withFreela);
    await user.click(await screen.findByTestId('button-edit-amount'));
    const input = await screen.findByTestId('input-forecast-amount');
    await user.clear(input);
    await user.type(input, '550');
    await user.click(screen.getByRole('button', { name: 'Salvar valor' }));
    await screen.findAllByText(/550,00/);
    expect((await store.getForecasts('2026-10')).items[0].amount).toBe(550);
  });

  it('um lembrete pode ser colocado no saldo', async () => {
    const { user, screen, store } = await openApp('#/previsoes/dia/2026-10-22', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'receive', description: 'Lembrete', amount: 90, date: '2026-10-22', affects: false, recurring: false });
    });
    await user.click(await screen.findByTestId('button-put-in-balance'));
    await screen.findByTestId('text-day-total');
    expect((await store.getForecasts('2026-10')).items[0].affects).toBe(true);
  });

  it('apagar uma previsão avulsa a remove', async () => {
    const { user, screen, store } = await openApp('#/previsoes/dia/2026-10-20', withFreela);
    await user.click(await screen.findByTestId('button-delete-forecast'));
    await screen.findByTestId('text-forecast-day-empty');
    expect((await store.getForecasts('2026-10')).items).toHaveLength(0);
  });

  it('apagar uma recorrente pergunta o escopo', async () => {
    const { user, screen, store } = await openApp('#/previsoes/dia/2026-10-20', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'receive', description: 'Mesada', amount: 100, date: '2026-10-20', affects: true, recurring: true });
    });
    await user.click(await screen.findByTestId('button-delete-forecast'));
    await user.click(await screen.findByRole('button', { name: /só este mês/i }));
    await screen.findByTestId('text-forecast-day-empty');
    expect((await store.getForecasts('2026-11')).items).toHaveLength(1);
  });
});
