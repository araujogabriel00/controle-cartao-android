import { describe, expect, it, vi } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCard, withHistory } from '@/test/seeds';

// O jsdom não rola: o teste olha para qual grupo `scrollIntoView` foi chamado.
const spyScroll = () => {
  const spy = vi.fn();
  Element.prototype.scrollIntoView = spy;
  return () => spy.mock.contexts.map((el) => (el as HTMLElement).dataset.testid);
};

describe('Todas as compras', () => {
  it('agrupa por mês, com as parcelas previstas', async () => {
    const { screen } = await openApp('#/compras', withHistory);
    expect(await screen.findByTestId('group-2026-12')).toBeInTheDocument();
    expect(screen.getByTestId('total-2026-10')).toHaveTextContent('200,00');
    expect(screen.getByTestId('total-2026-09')).toHaveTextContent('70,00');
    expect(screen.getByTestId('group-2026-11')).toHaveTextContent(/TV.*2\/3.*prevista/);
    expect(screen.getByTestId('group-2026-10')).toHaveTextContent(/TV.*1\/3/);
  });

  it('a busca filtra pelo texto', async () => {
    const { user, screen } = await openApp('#/compras', withHistory);
    await user.type(await screen.findByTestId('input-search'), 'merc');
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Mercado');
    expect(list).not.toHaveTextContent('Mes passado');
    expect(list).not.toHaveTextContent('TV');
  });

  it('o filtro de categoria deixa só as compras dela', async () => {
    const { user, screen } = await openApp('#/compras', async (s) => {
      const card = await withHistory(s);
      const cat = (await s.createCategory({ name: 'Comida' })) as { id: number };
      await s.createMovement(card.id, cat.id, { description: 'Pizza', amount: 40, date: '2026-10-12' });
    });
    await screen.findByText('Pizza');
    await user.selectOptions(screen.getByTestId('select-category'), 'Comida');
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Pizza');
    expect(list).not.toHaveTextContent('Mercado');
  });

  it('abrir uma compra lançada abre a edição', async () => {
    const { user, screen } = await openApp('#/compras', withHistory);
    await user.click(await screen.findByLabelText('Editar Mercado'));
    expect(await screen.findByTestId('input-movement-description')).toHaveValue('Mercado');
  });

  it('Voltar leva ao painel do mês atual', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', withHistory);
    await user.click(await screen.findByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  // specs/redesign-v2-historico-e-compras.md
  it('o item mostra a parcela, a categoria, a data e "prevista" em texto', async () => {
    const { screen } = await openApp('#/compras', withHistory);
    expect(await screen.findByTestId('group-2026-11')).toHaveTextContent(/Parcela 2\/3 · 05 de nov · prevista/);
  });

  it('com categoria mostra a etiqueta com ✕ e o total do filtro; o ✕ limpa', async () => {
    const { user, screen } = await openApp('#/compras', async (s) => {
      const card = await withHistory(s);
      const cat = (await s.createCategory({ name: 'Comida' })) as { id: number };
      await s.createMovement(card.id, cat.id, { description: 'Pizza', amount: 40, date: '2026-10-12' });
      await s.createMovement(card.id, cat.id, { description: 'Sushi', amount: 60, date: '2026-09-12' });
    });
    await screen.findByText('Pizza');
    await user.selectOptions(screen.getByTestId('select-category'), 'Comida');
    expect(screen.getByTestId('button-clear-category')).toHaveTextContent('Comida');
    expect(plain(screen.getByTestId('text-filter-total').textContent)).toContain('R$ 100,00');
    await user.click(screen.getByTestId('button-clear-category'));
    expect(screen.queryByTestId('text-filter-total')).not.toBeInTheDocument();
    expect(screen.getByTestId('list-all-purchases')).toHaveTextContent('Mercado');
  });

  it('o filtro "Sem categoria" deixa só as compras sem categoria', async () => {
    const { user, screen } = await openApp('#/compras', async (s) => {
      const card = await withHistory(s);
      const cat = (await s.createCategory({ name: 'Comida' })) as { id: number };
      await s.createMovement(card.id, cat.id, { description: 'Pizza', amount: 40, date: '2026-10-12' });
    });
    await screen.findByText('Pizza');
    await user.selectOptions(screen.getByTestId('select-category'), 'Sem categoria');
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Mercado');
    expect(list).not.toHaveTextContent('Pizza');
  });

  it('sem resultado mostra o aviso e limpa a busca e o filtro', async () => {
    const { user, screen } = await openApp('#/compras', withHistory);
    await user.type(await screen.findByTestId('input-search'), 'zzzz');
    expect(screen.getByTestId('text-purchases-empty')).toHaveTextContent('Nenhuma compra encontrada.');
    await user.click(screen.getByTestId('button-clear-filters'));
    expect(screen.getByTestId('list-all-purchases')).toHaveTextContent('Mercado');
    expect(screen.getByTestId('input-search')).toHaveValue('');
  });

  it('o menu ⋯ exclui a compra e oferece Desfazer', async () => {
    const { user, screen } = await openApp('#/compras', withHistory);
    await screen.findByLabelText('Editar Mercado');
    await user.click(screen.getByLabelText('Mais opções de Mercado'));
    await user.click(await screen.findByTestId(/^button-delete-/));
    expect(await screen.findByText('Desfazer')).toBeInTheDocument();
    expect(screen.queryByLabelText('Editar Mercado')).not.toBeInTheDocument();
  });

  it('abre rolada até o mês de onde veio e o voltar leva a esse mês', async () => {
    const scrolled = spyScroll();
    const { user, screen, waitFor } = await openApp('#/compras/mes/2026-09', withHistory);
    await screen.findByTestId('group-2026-09');
    await waitFor(() => expect(scrolled()).toEqual(['group-2026-09']));
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes/mes/2026-09'));
  });

  it('sem mês na rota rola até o mês atual', async () => {
    const scrolled = spyScroll();
    const { screen, waitFor } = await openApp('#/compras', withHistory);
    await screen.findByTestId('group-2026-10');
    await waitFor(() => expect(scrolled()).toEqual(['group-2026-10']));
  });

  it('mês sem compras rola até o mais próximo, preferindo o anterior', async () => {
    const scrolled = spyScroll();
    const { screen, waitFor } = await openApp('#/compras/mes/2026-10', async (s) => {
      const card = (await s.saveCard({ name: 'Nubank' }, 'create')) as { id: number };
      await s.createMovement(card.id, null, { description: 'Agosto', amount: 10, date: '2026-08-10' });
      await s.createMovement(card.id, null, { description: 'Novembro', amount: 20, date: '2026-11-10' });
    });
    await screen.findByTestId('group-2026-08');
    await waitFor(() => expect(scrolled()).toEqual(['group-2026-08']));
  });

  it('a busca não rola a lista de novo', async () => {
    const scrolled = spyScroll();
    const { user, screen, waitFor } = await openApp('#/compras/mes/2026-09', withHistory);
    await waitFor(() => expect(scrolled()).toHaveLength(1));
    await user.type(screen.getByTestId('input-search'), 'merc');
    expect(scrolled()).toHaveLength(1);
  });

  it('um mês inválido na rota abre /compras', async () => {
    const { screen, waitFor } = await openApp('#/compras/mes/abc', withCard);
    await waitFor(() => expect(window.location.hash).toBe('#/compras'));
    expect(await screen.findByTestId('text-purchases-card')).toBeInTheDocument();
  });

  it('com o olho fechado nenhum valor em reais aparece', async () => {
    // O olho é global: fecha na aba Cartões e abre Todas as compras.
    const { user, screen } = await openApp('#/cartoes', withHistory);
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = '#/compras';
    await screen.findByTestId('group-2026-10');
    expect(document.body.innerHTML).not.toMatch(/R\$\s\d/);
  });
});
