import { describe, expect, it, vi } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { withCard, withHistory } from '@/test/seeds';

// O jsdom não rola: o teste olha para qual elemento `scrollIntoView` foi chamado.
const spyScroll = () => {
  const spy = vi.fn();
  Element.prototype.scrollIntoView = spy;
  return () => spy.mock.contexts.map((el) => (el as HTMLElement).dataset.testid);
};

// specs/compras-um-mes-por-vez.md (hoje nos testes: 15/10/2026). Faixa: Dez, Nov, Out, Set, Ago (vazio), Jul.
// Out 400 (Mercado 100, Fone gamer 200, TV 1/3 100), Set 150 (Fone 80, Mes passado 70), Nov e Dez 100 (TV prevista), Jul 30.
const rich = async (s: Store) => {
  const card = await withHistory(s);
  const eletro = (await s.createCategory({ name: 'Eletrônicos' })) as { id: number };
  await s.createMovement(card.id, eletro.id, { description: 'Fone', amount: 80, date: '2026-09-12' });
  await s.createMovement(card.id, eletro.id, { description: 'Fone gamer', amount: 200, date: '2026-10-20' });
  await s.createMovement(card.id, null, { description: 'Julho', amount: 30, date: '2026-07-10' });
  return card;
};

describe('Todas as compras, um mês por vez', () => {
  it('abre no mês de onde veio, com a pílula marcada e levada à vista', async () => {
    const scrolled = spyScroll();
    const { screen, waitFor } = await openApp('#/compras/mes/2026-09', rich);
    expect(await screen.findByTestId('text-month-title')).toHaveTextContent('Setembro de 2026');
    expect(screen.getByTestId('pill-2026-09')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('pill-2026-10')).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(scrolled()).toContain('pill-2026-09'));
  });

  it('a partir da aba Cartões, "Todas as compras" abre no mês dela', async () => {
    const { user, screen, waitFor } = await openApp('#/cartoes/mes/2026-09', rich);
    await user.click(await screen.findByTestId('button-all-purchases'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras/mes/2026-09'));
    expect(await screen.findByTestId('text-month-title')).toHaveTextContent('Setembro de 2026');
  });

  it('a faixa traz um mês por pílula, do mais recente ao mais antigo, com o total', async () => {
    const { screen } = await openApp('#/compras', rich);
    await screen.findByTestId('strip-months');
    const pills = Array.from(screen.getByTestId('strip-months').querySelectorAll('button'));
    expect(pills.map((p) => p.textContent)).toEqual(['Dez 26100,00', 'Nov 26100,00', 'Out 26400,00', 'Set 26150,00', 'Ago 26—', 'Jul 2630,00']);
    expect(screen.getByTestId('pill-2026-10').getAttribute('aria-label')).toMatch(/^Outubro de 2026, 3 compras, R\$\s400,00$/);
    expect(screen.getByTestId('pill-2026-08').getAttribute('aria-label')).toBe('Agosto de 2026, 0 compras');
  });

  it('só o mês aberto aparece na lista', async () => {
    const { screen } = await openApp('#/compras', rich);
    const list = await screen.findByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Mercado');
    expect(list).toHaveTextContent(/TV.*1\/3/);
    expect(list).not.toHaveTextContent('Mes passado');
    expect(list).not.toHaveTextContent('2/3');
    expect(screen.getByTestId('text-month-count')).toHaveTextContent('3 compras');
    expect(screen.getByTestId('total-2026-10')).toHaveTextContent('400,00');
  });

  it('um mês futuro mostra as parcelas previstas', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('pill-2026-11'));
    expect(await screen.findByTestId('group-2026-11')).toHaveTextContent(/TV.*Parcela 2\/3 · .* · prevista/);
  });

  it('trocar de mês muda a rota sem empilhar histórico e leva a lista ao topo', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', rich);
    const before = window.history.length;
    document.documentElement.scrollTop = 500;
    await user.click(await screen.findByTestId('pill-2026-09'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras/mes/2026-09'));
    expect(screen.getByTestId('list-all-purchases')).toHaveTextContent('Mes passado');
    expect(screen.getByTestId('list-all-purchases')).not.toHaveTextContent('Mercado');
    expect(window.history.length).toBe(before);
    expect(document.documentElement.scrollTop).toBe(0);
  });

  it('trocar de mês não perde os filtros nem a tela remonta', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByTestId(/^filter-category-\d+$/));
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('tag-category')).toHaveTextContent('Eletrônicos');
    await user.click(screen.getByTestId('pill-2026-09'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras/mes/2026-09'));
    expect(screen.getByTestId('tag-category')).toHaveTextContent('Eletrônicos');
    expect(screen.getByTestId('list-all-purchases')).toHaveTextContent('Fone');
    expect(screen.getByTestId('list-all-purchases')).not.toHaveTextContent('Mes passado');
  });

  it('sair da tela descarta a busca e os filtros', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByTestId('filter-category-none'));
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('text-filter-count')).toBeInTheDocument();
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
    await user.click(await screen.findByTestId('button-all-purchases'));
    await screen.findByTestId('strip-months');
    expect(screen.queryByTestId('text-filter-count')).toBeNull();
  });

  it('o mês atual usa /compras', async () => {
    const { user, screen, waitFor } = await openApp('#/compras/mes/2026-09', rich);
    await user.click(await screen.findByTestId('pill-2026-10'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras'));
  });

  it('voltar leva à aba Cartões do mês aberto no momento', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('pill-2026-09'));
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes/mes/2026-09'));
  });

  it('o voltar do mês atual leva ao painel do mês atual', async () => {
    const { user, screen, waitFor } = await openApp('#/compras', withHistory);
    await user.click(await screen.findByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  it('buscar vale para todos os meses, agrupado por mês, com rodapé; a faixa some', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-search'));
    expect(screen.getByTestId('input-search')).toHaveFocus();
    await user.type(screen.getByTestId('input-search'), 'fone');
    expect(screen.queryByTestId('strip-months')).toBeNull();
    const groups = screen.getAllByTestId(/^group-/).map((g) => g.dataset.testid);
    expect(groups).toEqual(['group-2026-10', 'group-2026-09']);
    expect(plain(screen.getByTestId('text-search-footer').textContent)).toMatch(/2 resultados.*total R\$ 280,00/);
    expect(screen.getByTestId('group-2026-09')).toHaveTextContent('1 resultado');
  });

  it('sair da busca volta ao mês aberto: o ✕ limpa o texto e o voltar sai', async () => {
    const { user, screen } = await openApp('#/compras/mes/2026-09', rich);
    await user.click(await screen.findByTestId('button-search'));
    await user.type(screen.getByTestId('input-search'), 'fone');
    await user.click(screen.getByTestId('button-search-clear'));
    expect(screen.getByTestId('input-search')).toHaveValue('');
    expect(screen.getByTestId('text-purchases-empty')).toBeInTheDocument();
    await user.click(screen.getByTestId('button-search-back'));
    expect(screen.getByTestId('text-month-title')).toHaveTextContent('Setembro de 2026');
    expect(screen.getByTestId('strip-months')).toBeInTheDocument();
  });

  it('busca sem resultado mostra o aviso', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-search'));
    await user.type(screen.getByTestId('input-search'), 'zzzz');
    expect(screen.getByTestId('text-purchases-empty')).toHaveTextContent('Nenhuma compra encontrada.');
  });

  it('filtra por categoria e tipo: contador, etiquetas e totais da faixa', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByRole('button', { name: 'Eletrônicos' }));
    await user.click(screen.getByTestId('filter-type-installment'));
    // Eletrônicos e parceladas: só a TV (a TV não tem categoria, então "e" zera tudo).
    expect(screen.getByTestId('button-filters-apply')).toHaveTextContent('Ver 0 compras');
    await user.click(screen.getByTestId('filter-type-installment'));
    expect(screen.getByTestId('button-filters-apply')).toHaveTextContent('Ver 2 compras');
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('text-filter-count')).toHaveTextContent('1');
    expect(screen.getByTestId('tag-category')).toBeInTheDocument();
    expect(screen.getByTestId('pill-2026-10')).toHaveTextContent('200,00');
    expect(screen.getByTestId('pill-2026-09')).toHaveTextContent('80,00');
    expect(screen.getByTestId('pill-2026-11')).toHaveTextContent('—');
    expect(screen.getByTestId('text-month-count')).toHaveTextContent('1 de 3 compras');
    expect(screen.getByText('Os filtros valem para todos os meses.')).toBeInTheDocument();
  });

  it('os tipos se combinam com "ou"', async () => {
    const { user, screen } = await openApp('#/compras', async (s) => {
      const card = await rich(s);
      await s.createRecurring(card.id, null, { description: 'Assinatura', amount: 20, date: '2026-10-03' });
    });
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByTestId('filter-type-installment'));
    expect(screen.getByTestId('button-filters-apply')).toHaveTextContent(/Ver \d+ compras/);
    const parceladas = Number(screen.getByTestId('button-filters-apply').textContent!.match(/\d+/)![0]);
    await user.click(screen.getByTestId('filter-type-recurring'));
    const both = Number(screen.getByTestId('button-filters-apply').textContent!.match(/\d+/)![0]);
    expect(both).toBeGreaterThan(parceladas);
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('text-filter-count')).toHaveTextContent('2');
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Assinatura');
    expect(list).toHaveTextContent('TV');
    expect(list).not.toHaveTextContent('Mercado');
  });

  it('categoria e tipo se combinam com "e"', async () => {
    const { user, screen } = await openApp('#/compras', async (s) => {
      const card = await withCard(s);
      const mercado = (await s.createCategory({ name: 'Mercado' })) as { id: number };
      await s.createMovement(card.id, mercado.id, { description: 'Feira', amount: 50, date: '2026-10-11' });
      await s.createPurchase(card.id, mercado.id, { description: 'Geladeira', totalAmount: 200, installmentCount: 2, installment: 1, date: '2026-10-12' });
      await s.createPurchase(card.id, null, { description: 'Sofá', totalAmount: 200, installmentCount: 2, installment: 1, date: '2026-10-13' });
    });
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByRole('button', { name: 'Mercado' }));
    await user.click(screen.getByTestId('filter-type-installment'));
    await user.click(screen.getByTestId('button-filters-apply'));
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Geladeira');
    expect(list).not.toHaveTextContent('Feira');
    expect(list).not.toHaveTextContent('Sofá');
  });

  it('o ✕ da etiqueta remove só aquele filtro e "Limpar" zera a folha', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByRole('button', { name: 'Eletrônicos' }));
    await user.click(screen.getByTestId('filter-type-planned'));
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('text-filter-count')).toHaveTextContent('2');
    await user.click(screen.getByTestId('tag-type-planned'));
    expect(screen.queryByTestId('tag-type-planned')).toBeNull();
    expect(screen.getByTestId('tag-category')).toBeInTheDocument();
    expect(screen.getByTestId('pill-2026-11')).toHaveTextContent('—');
    await user.click(screen.getByTestId('button-filters'));
    await user.click(screen.getByTestId('button-filters-clear'));
    expect(screen.getByTestId('filter-category-all')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('filter-type-planned')).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.queryByTestId('text-filter-count')).toBeNull();
    expect(screen.getByTestId('pill-2026-11')).toHaveTextContent('100,00');
  });

  it('fechar a folha pelo ✕ descarta a escolha', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByRole('button', { name: 'Eletrônicos' }));
    await user.click(screen.getByTestId('button-close-filters'));
    expect(screen.queryByTestId('sheet-filters')).toBeNull();
    expect(screen.queryByTestId('text-filter-count')).toBeNull();
    expect(screen.queryByTestId('tag-category')).toBeNull();
  });

  it('o filtro de "Sem categoria" deixa só as compras sem categoria', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByTestId('filter-category-none'));
    await user.click(screen.getByTestId('button-filters-apply'));
    const list = screen.getByTestId('list-all-purchases');
    expect(list).toHaveTextContent('Mercado');
    expect(list).not.toHaveTextContent('Fone gamer');
  });

  it('mês sem compras oferece lançar e ir ao mês mais recente com compras', async () => {
    const { user, screen, waitFor } = await openApp('#/compras/mes/2026-08', rich);
    expect(await screen.findByTestId('text-purchases-empty')).toHaveTextContent('Nenhuma compra em agosto');
    expect(screen.getByTestId('button-new-purchase-month')).toHaveTextContent('Lançar compra de agosto');
    await user.click(screen.getByTestId('button-nearest-month'));
    // Agosto: o mais recente anterior com compras é julho.
    await waitFor(() => expect(window.location.hash).toBe('#/compras/mes/2026-07'));
    expect(screen.getByTestId('text-month-title')).toHaveTextContent('Julho de 2026');
  });

  it('"Lançar compra de agosto" abre o formulário com a data em agosto', async () => {
    const { user, screen } = await openApp('#/compras/mes/2026-08', rich);
    await user.click(await screen.findByTestId('button-new-purchase-month'));
    expect(String((await screen.findByTestId('input-movement-date') as HTMLInputElement).value)).toMatch(/^2026-08-/);
  });

  it('mês vazio por causa do filtro troca "Lançar" por "Limpar filtros"', async () => {
    const { user, screen } = await openApp('#/compras/mes/2026-07', rich);
    await user.click(await screen.findByTestId('button-filters'));
    await user.click(screen.getByRole('button', { name: 'Eletrônicos' }));
    await user.click(screen.getByTestId('button-filters-apply'));
    expect(screen.getByTestId('text-purchases-empty')).toHaveTextContent('Nenhuma compra com esses filtros em julho');
    expect(screen.queryByTestId('button-new-purchase-month')).toBeNull();
    await user.click(screen.getByTestId('button-clear-filters'));
    expect(screen.getByTestId('list-all-purchases')).toHaveTextContent('Julho');
  });

  it('sem nenhuma compra no cartão mostra o estado vazio, sem faixa, busca nem filtros', async () => {
    const { screen } = await openApp('#/compras', async (s) => { await s.saveCard({ name: 'Nubank' }, 'create'); });
    expect(await screen.findByTestId('text-purchases-empty')).toHaveTextContent('Nenhuma compra neste cartão.');
    expect(screen.queryByTestId('strip-months')).toBeNull();
    expect(screen.queryByTestId('button-search')).toBeNull();
    expect(screen.queryByTestId('button-filters')).toBeNull();
  });

  it('abrir uma compra lançada abre a edição', async () => {
    const { user, screen } = await openApp('#/compras/mes/2026-09', rich);
    await user.click(await screen.findByLabelText('Editar Mes passado'));
    expect(await screen.findByTestId('input-movement-description')).toHaveValue('Mes passado');
  });

  it('o menu ⋯ exclui a compra, oferece Desfazer e atualiza o total da pílula e do mês', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await screen.findByLabelText('Editar Mercado');
    expect(screen.getByTestId('pill-2026-10')).toHaveTextContent('400,00');
    await user.click(screen.getByLabelText('Mais opções de Mercado'));
    await user.click(await screen.findByTestId(/^button-delete-/));
    expect(await screen.findByText('Desfazer')).toBeInTheDocument();
    expect(screen.queryByLabelText('Editar Mercado')).not.toBeInTheDocument();
    expect(screen.getByTestId('pill-2026-10')).toHaveTextContent('300,00');
    expect(screen.getByTestId('total-2026-10')).toHaveTextContent('300,00');
  });

  it('editar e excluir funcionam nos resultados da busca', async () => {
    const { user, screen } = await openApp('#/compras', rich);
    await user.click(await screen.findByTestId('button-search'));
    await user.type(screen.getByTestId('input-search'), 'fone');
    await user.click(screen.getByLabelText('Editar Fone gamer'));
    expect(await screen.findByTestId('input-movement-description')).toHaveValue('Fone gamer');
  });

  it('com o olho fechado nenhum valor em reais aparece, nem em aria-label', async () => {
    // O olho é global: fecha na aba Cartões e abre Todas as compras.
    const { user, screen } = await openApp('#/cartoes', rich);
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = '#/compras';
    await screen.findByTestId('pill-2026-10');
    expect(screen.getByTestId('pill-2026-10')).toHaveTextContent('••••');
    expect(screen.getByTestId('pill-2026-10').getAttribute('aria-label')).toBe('Outubro de 2026, 3 compras');
    expect(document.body.innerHTML).not.toMatch(/R\$\s\d/);
    expect(document.body.innerHTML).not.toMatch(/aria-label="[^"]*\d+,\d{2}/);
  });

  it('um mês inválido na rota abre /compras', async () => {
    const { screen, waitFor } = await openApp('#/compras/mes/abc', withCard);
    await waitFor(() => expect(window.location.hash).toBe('#/compras'));
    expect(await screen.findByTestId('text-purchases-card')).toBeInTheDocument();
  });

  it('um mês longe das outras compras entra na faixa, sem pular meses', async () => {
    const { screen } = await openApp('#/compras/mes/2027-03', withCard);
    await screen.findByTestId('strip-months');
    const ids = Array.from(screen.getByTestId('strip-months').querySelectorAll('button')).map((b) => b.dataset.testid);
    expect(ids[0]).toBe('pill-2027-03');
    expect(ids).toContain('pill-2026-12');
    expect(ids[ids.length - 1]).toBe('pill-2026-10');
    expect(new Set(ids).size).toBe(ids.length);
  });
});
