import { describe, expect, it } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { withCard, withHistory } from '@/test/seeds';

// Faturas fechadas de maio a setembro (1850, 2200, 2600, 3100 e 3420) e a de outubro (R$ 100,00 de withCard) em aberto.
const withClosedMonths = async (s: Store) => {
  const card = await withCard(s);
  const amounts: Record<string, number> = { '2026-05': 1850, '2026-06': 2200, '2026-07': 2600, '2026-08': 3100, '2026-09': 3420 };
  for (const [month, amount] of Object.entries(amounts)) await s.createMovement(card.id, null, { description: `Fatura ${month}`, amount, date: `${month}-10` });
  return card;
};

describe('Histórico', () => {
  it('lista as faturas de cada mês e as parcelas dos próximos', async () => {
    const { screen } = await openApp('#/historico', withHistory);
    expect(await screen.findByTestId('card-month-2026-10')).toHaveTextContent(/200,00.*2 compras/);
    expect(screen.getByTestId('card-month-2026-09')).toHaveTextContent(/70,00.*1 compra/);
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

  // specs/redesign-v2-historico-e-compras.md — Gráfico do histórico com 6 colunas
  it('o gráfico tem 6 colunas e o mês atual aparece como em aberto', async () => {
    const { screen } = await openApp('#/historico', withClosedMonths);
    const chart = await screen.findByTestId('section-history-chart');
    expect(chart.querySelectorAll('svg path')).toHaveLength(6);
    expect(chart).toHaveTextContent('em aberto');
    expect(plain(chart.querySelector('svg')?.getAttribute('aria-label'))).toContain('Outubro de 2026 R$ 100,00 (em aberto)');
  });

  // Média dos últimos 5 meses
  it('a média dos últimos 5 meses fechados', async () => {
    const { screen } = await openApp('#/historico', withClosedMonths);
    expect(plain((await screen.findByTestId('text-history-average')).textContent)).toBe('Média dos últimos 5 mesesR$ 2.634,00');
  });

  // Média só com meses fechados
  it('a média ignora o mês atual', async () => {
    const { screen } = await openApp('#/historico', withHistory);
    expect(plain((await screen.findByTestId('text-history-average')).textContent)).toContain('R$ 70,00');
  });

  // Sem meses fechados não há média
  it('sem meses fechados não mostra a média', async () => {
    const { screen } = await openApp('#/historico', withCard);
    await screen.findByTestId('section-history-chart');
    expect(screen.queryByTestId('text-history-average')).not.toBeInTheDocument();
  });

  // Todos os meses
  it('"Todos os meses" diz se a fatura está fechada ou em aberto', async () => {
    const { screen } = await openApp('#/historico', withHistory);
    expect(await screen.findByTestId('card-month-2026-10')).toHaveTextContent('em aberto');
    expect(screen.getByTestId('card-month-2026-09')).toHaveTextContent('fatura fechada');
    const rows = screen.getAllByTestId(/^card-month-/).map((item) => item.dataset.testid);
    expect(rows).toEqual(['card-month-2026-10', 'card-month-2026-09']);
  });

  // Mais de um cartão
  it('com mais de um cartão mostra a fatura de todos os cartões', async () => {
    const { screen } = await openApp('#/historico', async (s) => {
      await withHistory(s);
      const second = (await s.saveCard({ name: 'Inter' }, 'create')) as { id: number };
      await s.createMovement(second.id, null, { description: 'Padaria', amount: 30, date: '2026-10-11' });
    });
    expect(await screen.findByTestId('text-all-cards-2026-10')).toHaveTextContent(/Todos os cartões:.*fatura/);
  });

  // Histórico vazio
  it('sem nenhuma compra mostra o estado vazio com a chamada para lançar', async () => {
    const { user, screen, waitFor } = await openApp('#/historico');
    expect(await screen.findByTestId('text-history-empty')).toBeInTheDocument();
    await user.click(screen.getByTestId('button-history-launch'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  // Olho fechado
  it('com o olho fechado nenhum valor em reais aparece', async () => {
    // O olho é global: fecha na aba Cartões e abre o Histórico.
    const { user, screen } = await openApp('#/cartoes', withClosedMonths);
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = '#/historico';
    await screen.findByTestId('text-history-average');
    expect(screen.getByTestId('text-history-average')).not.toHaveTextContent('R$ 2.634');
    expect(document.body.innerHTML).not.toMatch(/R\$\s\d/);
    expect(screen.getByTestId('section-history-chart').querySelector('svg')).toBeNull();
  });
});
