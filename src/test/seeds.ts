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

// Sonhos (specs/sonhos.md): renda de R$ 4.527,00 no mês e atalhos para criar sonhos já com o guardado inicial.
export const withRenda = async (s: Store) => { await s.createIncome({ kind: 'salario', amount: 4527, date: '2026-10-05', recurring: true }); };

export const newDream = async (s: Store, name: string, goal: number, share: number, initial = 0, icon: 'plane' | 'shield' | 'laptop' = 'plane') =>
  (await s.createDream({ name, goal, initial, icon, share })) as { id: number };

// "Japão", "Reserva" e "Notebook" ativos, com a divisão 40/35/25 já salva no plano (percentual dado).
export const withThreeDreams = async (s: Store, percent = 20) => {
  await withRenda(s);
  const japan = await newDream(s, 'Viagem ao Japão', 18000, 100, 4320);
  const reserve = await newDream(s, 'Reserva', 20000, 50, 6750, 'shield');
  const notebook = await newDream(s, 'Notebook novo', 6000, 25, 5900, 'laptop');
  await s.saveDreamPlan({ percent, shares: [{ dreamId: japan.id, share: 40 }, { dreamId: reserve.id, share: 35 }, { dreamId: notebook.id, share: 25 }] });
  return { japan, reserve, notebook };
};
