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
  type User = { click: (el: Element) => Promise<void> };
  const openSheet = async (user: User, screen: { findByTestId: (id: string) => Promise<HTMLElement> }) => user.click(await screen.findByTestId('button-open-sheet'));
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

  // specs/previsoes-folha-recolhida.md
  it('a folha começa recolhida, com o título e "N previsões · saldo" do dia, sem a lista', async () => {
    const { screen } = await openApp('#/previsoes', withDays);
    expect(await screen.findByTestId('bar-day')).toHaveTextContent('Quinta, 15 de outubro');
    expect(plain(screen.getByTestId('text-bar-summary').textContent)).toBe('Nada previsto · saldo R$ 1.850,00');
    expect(screen.getByTestId('button-open-sheet')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('list-forecasts')).toBeNull();
    expect(screen.queryByTestId('sheet-day')).toBeNull();
  });

  it('a barra mostra "1 previsão · saldo" ao trocar de dia, e dia passado sem saldo', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    expect(plain(screen.getByTestId('text-bar-summary').textContent)).toBe('1 previsão · saldo R$ 2.650,00');
    expect(screen.getByTestId('bar-day')).toHaveTextContent('Terça, 20 de outubro');
    await user.click(screen.getByTestId('day-2026-10-05'));
    expect(plain(screen.getByTestId('text-bar-summary').textContent)).toBe('Nada previsto');
  });

  it('o calendário reserva a altura da barra e as células têm 50 px', async () => {
    const { screen } = await openApp('#/previsoes', withDays);
    expect((await screen.findByTestId('day-2026-10-31')).className).toContain('h-[50px]');
    const page = screen.getByTestId('calendar-forecasts').parentElement!;
    expect(page.className).toContain('pb-[calc(68px+12px)]');
    expect(document.documentElement.style.getPropertyValue('--forecast-sheet-h')).toBe('');
  });

  it('abrir a folha mostra a lista, o saldo com centavos e os botões "Abrir o dia" e "+ Nova previsão"', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    await openSheet(user, screen);
    const sheet = screen.getByTestId('sheet-day');
    expect(sheet).toHaveTextContent('Venda');
    expect(plain(screen.getByTestId('text-day-balance').textContent)).toBe('R$ 2.650,00');
    expect(screen.getByTestId('button-open-day')).toHaveTextContent('Abrir o dia');
    expect(screen.getByTestId('button-new-forecast-sheet')).toHaveTextContent('Nova previsão');
    expect(screen.queryByTestId('bar-day')).toBeNull();
  });

  it('o foco vai ao título da folha ao abrir e volta ao botão ao recolher; Escape recolhe', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    await waitFor(() => expect(screen.getByTestId('text-sheet-title')).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByTestId('button-open-sheet')).toHaveFocus());
    expect(screen.getByTestId('button-open-sheet')).toHaveAttribute('aria-expanded', 'false');
  });

  it('tocar no fundo escurecido recolhe a folha, mas tocar na folha não', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    await user.click(screen.getByTestId('sheet-day'));
    expect(screen.getByTestId('sheet-day')).toBeInTheDocument();
    await user.click(screen.getByTestId('overlay-day'));
    expect(screen.queryByTestId('sheet-day')).toBeNull();
    expect(screen.getByTestId('bar-day')).toBeInTheDocument();
  });

  it('arrastar a alça para baixo recolhe a folha', async () => {
    const { user, screen, fireEvent } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    const handle = screen.getByTestId('sheet-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 200 }] });
    expect(screen.queryByTestId('sheet-day')).toBeNull();
  });

  it('trocar de dia com a folha aberta atualiza a folha', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    expect(plain((await screen.findByTestId('text-day-balance')).textContent)).toBe('R$ 1.850,00');
    expect(screen.getByTestId('text-forecast-day-empty')).toHaveTextContent('Nada previsto para hoje.');
    await user.click(screen.getByTestId('day-2026-10-20'));
    expect(plain(screen.getByTestId('text-day-balance').textContent)).toBe('R$ 2.650,00');
    expect(screen.getByTestId('sheet-day')).toHaveTextContent('Venda');
    await user.click(screen.getByTestId('day-2026-10-21'));
    expect(screen.getByTestId('text-forecast-day-empty')).toHaveTextContent('Nada previsto para este dia.');
  });

  it('dia passado na folha aberta não mostra o saldo', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('day-2026-10-05'));
    await openSheet(user, screen);
    expect(screen.getByTestId('text-forecast-day-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('text-day-balance')).toBeNull();
  });

  it('"Abrir o dia" abre a tela do dia', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    await user.click(screen.getByTestId('button-open-day'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/dia/2026-10-15'));
  });

  it('o "+" da barra e o "+ Nova previsão" da folha abrem o formulário', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withDays);
    await user.click(await screen.findByTestId('button-new-forecast-bar'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/nova'));
    expect(await screen.findByTestId('form-forecast')).toBeInTheDocument();
    window.location.hash = '#/previsoes';
    await openSheet(user, screen);
    await user.click(screen.getByTestId('button-new-forecast-sheet'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/nova'));
  });

  it('não há botão flutuante: só um "Nova previsão", dentro da barra do dia', async () => {
    const { screen } = await openApp('#/previsoes', withDays);
    await screen.findByTestId('bar-day');
    expect(screen.queryByTestId('button-new-forecast')).toBeNull();
    expect(screen.queryByTestId('button-quick-add')).toBeNull();
    const buttons = screen.getAllByRole('button', { name: 'Nova previsão' });
    expect(buttons).toHaveLength(1);
    expect(screen.getByTestId('bar-day')).toContainElement(buttons[0]);
  });

  it('o botão Lançar das outras áreas continua', async () => {
    const { screen } = await openApp('#/cartoes', withDays);
    expect(await screen.findByTestId('button-quick-add')).toBeInTheDocument();
  });

  it('trocar de mês recolhe a folha', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withDays);
    await openSheet(user, screen);
    expect(screen.getByTestId('sheet-day')).toBeInTheDocument();
    await user.click(screen.getByTestId('button-next-month'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/mes/2026-11'));
    expect(await screen.findByTestId('bar-day')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-day')).toBeNull();
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
    await openSheet(user, screen);
    expect(screen.getByTestId('text-day-balance')).toHaveClass('text-alert');
  });

  it('saldo muito grande é abreviado com k', async () => {
    const { screen } = await openApp('#/previsoes', async (s) => {
      await withCash(s);
      await s.createForecast({ kind: 'receive', description: 'Herança', amount: 110570, date: '2026-10-18', affects: true, recurring: false });
    });
    expect(await screen.findByTestId('balance-2026-10-18')).toHaveTextContent('112k');
  });

  it('a legenda mostra o saldo do dia selecionado, não um número fixo', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    expect(await screen.findByTestId('legend-balance')).toHaveTextContent('1.850');
    await user.click(screen.getByTestId('day-2026-10-20'));
    expect(screen.getByTestId('legend-balance')).toHaveTextContent('2.650');
    await user.click(screen.getByTestId('day-2026-10-05'));
    expect(screen.getByTestId('legend-balance')).toHaveTextContent('1.850');
    expect(document.body.textContent).not.toContain('10.070');
    await user.click(screen.getByTestId('button-hide-values'));
    expect(screen.getByTestId('legend-balance')).toHaveTextContent('•••');
  });

  it('com o olho fechado as células, a barra e a folha não mostram valores', async () => {
    const { user, screen } = await openApp('#/previsoes', withDays);
    await screen.findByTestId('balance-2026-10-15');
    await user.click(screen.getByTestId('button-hide-values'));
    expect(screen.getByTestId('balance-2026-10-20')).toHaveTextContent('•••');
    expect(plain(screen.getByTestId('text-bar-summary').textContent)).toBe('Nada previsto · saldo R$ ••••');
    expect(screen.getByTestId('button-open-sheet').getAttribute('aria-label')).not.toMatch(/R\$\s*\d/);
    await openSheet(user, screen);
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
    await openSheet(user, screen);
    expect(await screen.findByText('Freela')).toBeInTheDocument();
  });

  it('o botão Nova previsão abre o formulário', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withCash);
    await user.click(await screen.findByTestId('button-new-forecast-bar'));
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
    await openSheet(user, screen);
    await user.click(await screen.findByLabelText(/Editar previsão Freela/));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/previsoes\/editar\/\d+\/2026-10$/));
    expect(await screen.findByTestId('input-forecast-description')).toHaveValue('Freela');
  });
});
