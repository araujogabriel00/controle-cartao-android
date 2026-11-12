import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCash } from '@/test/seeds';

const withForecast = async (s: import('@/test/app').Store) => {
  await withCash(s);
  await s.createForecast({ kind: 'receive', description: 'Freela', amount: 400, date: '2026-10-20', affects: false, recurring: false });
};

describe('Previsões', () => {
  // specs/previsoes-saldo-por-dia.md (hoje nos testes: 15/10/2026, saldo R$ 1.850,00).
  const withDays = async (s: import('@/test/app').Store) => {
    await withCash(s);
    await s.createForecast({ kind: 'receive', description: 'Venda', amount: 800, date: '2026-10-20', affects: true, recurring: false });
    await s.createForecast({ kind: 'pay', description: 'Seguro', amount: 350, date: '2026-10-25', affects: true, recurring: false });
    await s.createForecast({ kind: 'receive', description: 'Lembrete', amount: 300, date: '2026-10-22', affects: false, recurring: false });
  };
  const balanceOn = async (store: import('@/test/app').Store, month: string, day: number) => (await store.getForecastDayBalances(month))[day - 1].balance;

  it('não mostra mais o cartão de resumo', async () => {
    const { screen } = await openApp('#/previsoes', withForecast);
    await screen.findByTestId('calendar-forecasts');
    expect(screen.queryByTestId('card-forecast-summary')).toBeNull();
    expect(screen.queryByText(/Saldo hoje/)).toBeNull();
  });

  it('mostra o saldo de cada dia, em negrito nos dias com previsão e em hoje, e nenhum nos dias passados', async () => {
    const { screen } = await openApp('#/previsoes', withDays);
    expect(await screen.findByTestId('balance-2026-10-15')).toHaveTextContent('1.850');
    expect(screen.getByTestId('balance-2026-10-15')).toHaveClass('font-bold');
    expect(screen.getByTestId('balance-2026-10-19')).toHaveTextContent('1.850');
    expect(screen.getByTestId('balance-2026-10-19')).not.toHaveClass('font-bold');
    expect(screen.getByTestId('balance-2026-10-20')).toHaveTextContent('2.650');
    expect(screen.getByTestId('balance-2026-10-20')).toHaveClass('font-bold');
    expect(screen.getByTestId('balance-2026-10-22')).toHaveTextContent('2.650');
    expect(screen.getByTestId('balance-2026-10-25')).toHaveTextContent('2.300');
    expect(screen.getByTestId('balance-2026-10-31')).toHaveTextContent('2.300');
    expect(screen.getByTestId('balance-2026-10-14')).toBeEmptyDOMElement();
    expect(screen.getByTestId('day-2026-10-20').getAttribute('aria-label')).toMatch(/saldo R\$\s2\.650,00/);
  });

  it('o último dia bate com o Saldo previsto; mês passado não tem saldo', async () => {
    const { store } = await openApp('#/previsoes', withDays);
    const days = await store.getForecastDayBalances('2026-10');
    expect(days[30].balance).toBe((await store.getBalanceForecast('2026-10', 16)).endBalance);
    expect((await store.getForecastDayBalances('2026-09')).every((d) => d.balance === null)).toBe(true);
  });

  it('mês futuro mostra o saldo do dia 1 ao último dia, partindo do que ainda estava por vir', async () => {
    const { store } = await openApp('#/previsoes', withDays);
    await store.createForecast({ kind: 'pay', description: 'Dentista', amount: 500, date: '2026-11-10', affects: true, recurring: false });
    const days = await store.getForecastDayBalances('2026-11');
    expect(days).toHaveLength(30);
    expect(days.every((d) => d.balance !== null)).toBe(true);
    const base = (await store.getMonthCash('2026-11')).balanceAmount;
    // R$ 450 pendentes de outubro (800 − 350) entram no saldo base de novembro.
    expect(days[0].balance).toBeCloseTo(base + 450, 2);
    expect(days[29].balance).toBeCloseTo(base - 50, 2);
  });

  it('lembrete não muda o saldo e "Colocar no saldo" muda os dias seguintes', async () => {
    const { store } = await openApp('#/previsoes', withDays);
    expect(await balanceOn(store, '2026-10', 21)).toBe(2650);
    const reminder = (await store.getForecasts('2026-10')).items.find((i) => i.description === 'Lembrete')!;
    await store.putForecastInBalance(reminder.forecastId, '2026-10');
    expect(await balanceOn(store, '2026-10', 21)).toBe(2650);
    expect(await balanceOn(store, '2026-10', 22)).toBe(2950);
    expect(await balanceOn(store, '2026-10', 31)).toBe(2600);
  });

  it('apagar uma previsão recalcula os dias', async () => {
    const { store } = await openApp('#/previsoes', withDays);
    const seguro = (await store.getForecasts('2026-10')).items.find((i) => i.description === 'Seguro')!;
    await store.deleteForecast(seguro.forecastId, '2026-10', 'month');
    expect(await balanceOn(store, '2026-10', 25)).toBe(2650);
  });

  it('a folha começa em hoje com o saldo do fim do dia e muda ao escolher outro dia', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    expect(plain((await screen.findByTestId('text-day-balance')).textContent)).toBe('R$ 1.850,00');
    await user.click(screen.getByTestId('day-2026-10-20'));
    expect(plain(screen.getByTestId('text-day-balance').textContent)).toBe('R$ 2.650,00');
    expect(screen.getByTestId('sheet-day')).toHaveTextContent('Venda');
    await user.click(screen.getByTestId('day-2026-10-21'));
    expect(screen.getByTestId('text-forecast-day-empty')).toHaveTextContent('Nada previsto para este dia.');
    expect(plain(screen.getByTestId('text-day-balance').textContent)).toBe('R$ 2.650,00');
  });

  it('dia passado na folha não mostra o saldo', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('day-2026-10-05'));
    expect(screen.getByTestId('text-forecast-day-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('text-day-balance')).toBeNull();
  });

  it('o título da folha abre o dia', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('button-open-day'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/dia/2026-10-15'));
  });

  it('saldo negativo tem sinal, cor de alerta e nome acessível', async () => {
    const { user, screen } = await openApp('#/previsoes', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'pay', description: 'Carro', amount: 3000, date: '2026-10-18', affects: true, recurring: false });
    });
    expect(await screen.findByTestId('balance-2026-10-18')).toHaveTextContent('−1.150');
    expect(screen.getByTestId('balance-2026-10-18')).toHaveClass('text-alert');
    expect(screen.getByTestId('day-2026-10-18').getAttribute('aria-label')).toMatch(/saldo negativo/);
    await user.click(screen.getByTestId('day-2026-10-18'));
    expect(screen.getByTestId('text-day-balance')).toHaveClass('text-alert');
  });

  it('saldo muito grande é abreviado com k', async () => {
    const { screen } = await openApp('#/previsoes', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'receive', description: 'Herança', amount: 110570, date: '2026-10-18', affects: true, recurring: false });
    });
    expect(await screen.findByTestId('balance-2026-10-18')).toHaveTextContent('112k');
  });

  it('com o olho fechado as células mostram ••• e a folha não mostra valores', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await screen.findByTestId('balance-2026-10-15');
    await user.click(screen.getByTestId('button-hide-values'));
    expect(screen.getByTestId('balance-2026-10-20')).toHaveTextContent('•••');
    expect(screen.getByTestId('text-day-balance').textContent).not.toMatch(/\d/);
  });

  it('sem previsões mostra o "Como funciona" e o calendário com saldo', async () => {
    const { screen } = await openApp('#/previsoes', withCash);
    expect(await screen.findByTestId('section-how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('balance-2026-10-31')).toHaveTextContent('1.850');
  });

  it('escolher um dia mostra a previsão dele', async () => {
    const { user, screen } = await openApp('#/previsoes', withForecast);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    expect(await screen.findByText('Freela')).toBeInTheDocument();
  });

  it('o botão Nova previsão abre o formulário', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withCash);
    await user.click(await screen.findByTestId('button-new-forecast'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/nova'));
    expect(await screen.findByTestId('form-forecast')).toBeInTheDocument();
  });

  it('cria uma previsão a receber pelo formulário', async () => {
    const { user, screen, store, waitFor } = await openApp('#/previsoes/nova', withCash);
    await user.type(await screen.findByTestId('input-forecast-description'), 'Bônus');
    await user.type(screen.getByTestId('input-forecast-amount'), '800');
    await user.clear(screen.getByTestId('input-forecast-date'));
    await user.type(screen.getByTestId('input-forecast-date'), '2026-10-25');
    await user.click(screen.getByTestId('button-save-forecast'));
    await waitFor(async () => expect((await store.getForecasts('2026-10')).items.map((i) => i.description)).toEqual(['Bônus']));
  });

  it('data passada no formulário mostra o erro', async () => {
    const { user, screen } = await openApp('#/previsoes/nova', withCash);
    await user.type(await screen.findByTestId('input-forecast-description'), 'Velha');
    await user.type(screen.getByTestId('input-forecast-amount'), '10');
    await user.clear(screen.getByTestId('input-forecast-date'));
    await user.type(screen.getByTestId('input-forecast-date'), '2026-10-01');
    await user.click(screen.getByTestId('button-save-forecast'));
    expect(await screen.findByTestId('text-form-error')).toHaveTextContent(/anterior a hoje/i);
  });

  it('editar abre o formulário preenchido', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withForecast);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    await user.click(await screen.findByLabelText(/Editar previsão Freela/));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/previsoes\/editar\/\d+\/2026-10$/));
    expect(await screen.findByTestId('input-forecast-description')).toHaveValue('Freela');
  });
});
