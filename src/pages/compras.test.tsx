import { describe, expect, it } from 'vitest';
import { openApp } from '@/test/app';
import { withHistory } from '@/test/seeds';

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
});
