import type { Store } from '@/test/app';

export const withCard = async (s: Store) => {
  const card = (await s.saveCard({ name: 'Nubank' }, 'create')) as { id: number };
  await s.createMovement(card.id, null, { description: 'Mercado', amount: 100, date: '2026-10-10' });
  return card;
};

export const withCash = async (s: Store) => {
  await withCard(s);
  await s.createIncome({ kind: 'salario', amount: 3000, date: '2026-10-05', recurring: true });
  await s.createBill({ name: 'Aluguel', amount: 1000, date: '2026-10-08' });
  await s.createDailyExpense(null, { description: 'Lanche', amount: 50, date: '2026-10-09' });
};

// Cartão com compra no mês passado, parcelada (3x) e uma sem categoria: Histórico e Compras.
export const withHistory = async (s: Store) => {
  const card = await withCard(s);
  await s.createMovement(card.id, null, { description: 'Mes passado', amount: 70, date: '2026-09-10' });
  await s.createPurchase(card.id, null, { description: 'TV', totalAmount: 300, installmentCount: 3, installment: 1, date: '2026-10-05' });
  return card;
};
