import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCard } from '@/test/seeds';

describe('Cartões', () => {
  it('mostra a fatura e as compras do mês', async () => {
    const { screen } = await openApp('#/cartoes', withCard);
    expect(plain((await screen.findByTestId('text-invoice')).textContent)).toContain('R$ 100,00');
    expect(screen.getByTestId('list-movements')).toHaveTextContent('Mercado');
  });

  it('lista todas as compras do mês, não só as 3 mais recentes', async () => {
    const { screen } = await openApp('#/cartoes', async (s) => {
      const card = await withCard(s);
      for (let i = 1; i <= 10; i++) await s.createMovement(card.id, null, { description: `Compra ${i}`, amount: 10, date: '2026-10-10' });
    });
    expect(await screen.findByTestId('text-invoice')).toBeInTheDocument();
    const list = screen.getByTestId('list-movements');
    expect(list.querySelectorAll('[data-testid^="row-movement-"]')).toHaveLength(11);
  });

  it('com filtro de categoria, lista todas as compras da categoria', async () => {
    Element.prototype.scrollIntoView = () => {};
    let food = 0;
    const { user, screen } = await openApp('#/cartoes', async (s) => {
      const card = await withCard(s);
      food = ((await s.createCategory({ name: 'Mercado' })) as { id: number }).id;
      for (let i = 1; i <= 5; i++) await s.createMovement(card.id, food, { description: `Feira ${i}`, amount: 10, date: '2026-10-10' });
    });
    const row = await screen.findByTestId(`row-summary-${food}`);
    await user.click(row.querySelector('button')!);
    expect(await screen.findByTestId('text-filter-total')).toHaveTextContent('R$ 50,00');
    const list = screen.getByTestId('list-movements');
    expect(list.querySelectorAll('[data-testid^="row-movement-"]')).toHaveLength(5);
  });

  it('"Todas as compras" abre no mês de onde veio', async () => {
    const { user, screen, waitFor } = await openApp('#/cartoes', withCard);
    await user.click(await screen.findByTestId('button-all-purchases'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras'));
  });

  it('"Todas as compras" num mês passado leva o mês na rota', async () => {
    const { user, screen, waitFor } = await openApp('#/cartoes/mes/2026-09', withCard);
    await user.click(await screen.findByTestId('button-all-purchases'));
    await waitFor(() => expect(window.location.hash).toBe('#/compras/mes/2026-09'));
  });

  it('o mês anterior abre vazio e volta ao atual', async () => {
    const { user, screen, waitFor } = await openApp('#/cartoes', withCard);
    await user.click(await screen.findByTestId('button-previous-month'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes/mes/2026-09'));
    expect(await screen.findByTestId('text-month')).toHaveTextContent(/setembro de 2026/i);
    await user.click(screen.getByTestId('button-next-month'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  it('lança uma compra pelo botão Lançar', async () => {
    const { user, screen, store } = await openApp('#/cartoes', withCard);
    await user.click(await screen.findByTestId('button-quick-add'));
    await user.click(await screen.findByTestId('quick-purchase'));
    await user.type(await screen.findByTestId('input-movement-description'), 'Farmácia');
    await user.type(screen.getByTestId('input-movement-amount'), '50');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(await screen.findByText('Farmácia')).toBeInTheDocument();
    const [card] = (await store.getCards('2026-10')).cards;
    expect(card.invoiceAmount).toBe(150);
  });

  it('excluir uma compra mostra o Desfazer, que a devolve', async () => {
    const { user, screen, store } = await openApp('#/cartoes', withCard);
    const [card] = (await store.getCards('2026-10')).cards;
    const [movement] = await store.getMovements(card.id, '2026-10');
    await user.click(await screen.findByTestId(`row-movement-${movement.id}`));
    await user.click(await screen.findByTestId('button-delete-movement'));
    const ok = await screen.findByTestId('button-confirm-ok').catch(() => null);
    if (ok) await user.click(ok);
    await user.click(await screen.findByTestId('button-undo'));
    await screen.findByText('Mercado');
    expect(await store.getMovements(card.id, '2026-10')).toHaveLength(1);
  });

  it('sem cartão cadastrado cria o primeiro', async () => {
    const { user, screen, store } = await openApp('#/cartoes');
    await user.click(await screen.findByTestId('button-create-card'));
    await user.type(await screen.findByTestId('input-card-name'), 'Inter');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await screen.findByText('Inter');
    expect((await store.getCards('2026-10')).cards.map((c) => c.name)).toEqual(['Inter']);
  });
});
