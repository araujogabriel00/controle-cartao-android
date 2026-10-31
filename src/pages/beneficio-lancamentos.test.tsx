import { describe, expect, it } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';

const withSpends = async (s: Store) => {
  const b = (await s.createBenefit({ name: 'VR', amount: 500, firstMonth: '2026-10' })) as { id: number };
  const cat = (await s.createCategory({ name: 'Comida' })) as { id: number };
  await s.createBenefitSpend(b.id, cat.id, { description: 'Almoço', amount: 35, date: '2026-10-10' });
  await s.createBenefitSpend(b.id, null, { description: 'Avulso', amount: 10, date: '2026-10-11' });
};

// Abre a lista pelo endereço depois de saber o id do benefício (o hash muda sem recarregar o app).
const openList = async (filter: (categoryId: number) => string) => {
  const app = await openApp('#/beneficios', withSpends);
  const [item] = (await app.store.getBenefits('2026-10')).items;
  const [category] = await app.store.getCategories();
  window.location.hash = `#/beneficios/lancamentos/${item.id}/${filter(category.id)}`;
  return app;
};

describe('Lançamentos do benefício', () => {
  it('todos mostra os dois lançamentos e o total', async () => {
    const { screen } = await openList(() => 'todos');
    expect(await screen.findByText('Almoço')).toBeInTheDocument();
    expect(screen.getByText('Avulso')).toBeInTheDocument();
    expect(plain(screen.getByTestId('text-spends-total').textContent)).toContain('R$ 45,00');
  });

  it('o filtro "sem" mostra só os sem categoria', async () => {
    const { screen } = await openList(() => 'sem');
    expect(await screen.findByText('Avulso')).toBeInTheDocument();
    expect(screen.queryByText('Almoço')).not.toBeInTheDocument();
  });

  it('o filtro por categoria mostra só os dela', async () => {
    const { screen } = await openList((id) => String(id));
    expect(await screen.findByText('Almoço')).toBeInTheDocument();
    expect(screen.queryByText('Avulso')).not.toBeInTheDocument();
    expect(plain(screen.getByTestId('text-spends-total').textContent)).toContain('R$ 35,00');
  });

  it('Voltar leva para Benefícios', async () => {
    const { user, screen, waitFor } = await openList(() => 'todos');
    await user.click(await screen.findByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/beneficios'));
  });
});
