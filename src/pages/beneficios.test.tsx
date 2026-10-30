import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';

const withBenefit = async (s: import('@/test/app').Store) => {
  const b = (await s.createBenefit({ name: 'VR', amount: 500, firstMonth: '2026-10' })) as { id: number };
  await s.createBenefitSpend(b.id, null, { description: 'Almoço', amount: 35, date: '2026-10-10' });
  return b;
};

describe('Benefícios', () => {
  it('mostra crédito, gasto e disponível', async () => {
    const { screen } = await openApp('#/beneficios', withBenefit);
    const available = await screen.findByTestId(/^text-benefit-available-/);
    expect(plain(available.textContent)).toContain('R$ 465,00');
    expect(screen.getByTestId(/^text-benefit-spent-/)).toHaveTextContent('35,00');
  });

  it('"todos os lançamentos" abre a lista do benefício', async () => {
    const { user, screen, waitFor } = await openApp('#/beneficios', withBenefit);
    await user.click(await screen.findByTestId(/^button-all-spends-/));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/beneficios\/lancamentos\/\d+\/todos$/));
    expect(await screen.findByText('Almoço')).toBeInTheDocument();
  });

  it('o gasto lançado reduz o disponível', async () => {
    const { user, screen, store } = await openApp('#/beneficios', withBenefit);
    await user.click(await screen.findByTestId('button-quick-add'));
    await user.click(await screen.findByTestId('quick-spend'));
    await user.type(await screen.findByTestId('input-spend-description'), 'Jantar');
    await user.type(screen.getByTestId('input-spend-amount'), '65');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await screen.findByText('Gasto registrado.');
    const [item] = (await store.getBenefits('2026-10')).items;
    expect(item).toMatchObject({ spentAmount: 100, availableAmount: 400 });
  });
});
