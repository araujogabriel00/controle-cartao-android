import { beforeEach, describe, expect, it, vi } from 'vitest';

// O store guarda o estado em cache no módulo: cada teste importa uma cópia nova.
type Store = typeof import('@/data/store');
let s: Store;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  s = await import('@/data/store');
});

const newCard = async (name = 'Nubank') => (await s.saveCard({ name }, 'create')) as { id: number };

describe('cartões e compras', () => {
  it('soma as compras na fatura do mês', async () => {
    const card = await newCard();
    await s.createMovement(card.id, null, { description: 'Mercado', amount: 100.5, date: '2026-10-10' });
    await s.createMovement(card.id, null, { description: 'Farmácia', amount: 49.5, date: '2026-10-12' });
    const found = await s.getCard(card.id, '2026-10');
    expect(found).toMatchObject({ invoiceAmount: 150, movementCount: 2 });
  });

  it('nome de cartão repetido é recusado', async () => {
    await newCard('Nubank');
    await expect(newCard('Nubank')).rejects.toThrow();
  });

  it('compra parcelada: resto em centavos fica na parcela 1', async () => {
    const card = await newCard();
    // 3ª parcela em outubro => primeira em agosto; 100,00 / 3 = 33,34 + 33,33 + 33,33
    await s.createPurchase(card.id, null, {
      description: 'TV', totalAmount: 100, installmentCount: 3, installment: 3, firstInstallment: 1, date: '2026-10-05',
    });
    const months = await Promise.all(['2026-08', '2026-09', '2026-10'].map((m) => s.getMovements(card.id, m)));
    const amounts = months.map((list) => list[0]?.amount);
    expect(amounts).toEqual([33.34, 33.33, 33.33]);
  });

  it('parcelas futuras aparecem como previstas', async () => {
    const card = await newCard();
    await s.createPurchase(card.id, null, {
      description: 'Sofa', totalAmount: 300, installmentCount: 3, installment: 1, date: '2026-10-05',
    });
    const future = await s.getFutureInstallments(card.id);
    expect(future.map((f) => [f.month, f.amount])).toEqual([['2026-11', 100], ['2026-12', 100]]);
  });

  it('valida o número de parcelas', async () => {
    const card = await newCard();
    await expect(s.createPurchase(card.id, null, {
      description: 'X', totalAmount: 100, installmentCount: 1, installment: 1, date: '2026-10-05',
    })).rejects.toThrow(/parcelas/i);
  });

  it('excluir e desfazer devolve a compra', async () => {
    const card = await newCard();
    const movement = (await s.createMovement(card.id, null, { description: 'Mercado', amount: 80, date: '2026-10-10' })) as { id: number };
    const { undoId } = (await s.deleteMovement(movement.id)) as { undoId: number };
    expect(await s.getMovements(card.id, '2026-10')).toHaveLength(0);
    await s.undoDeletion(undoId);
    expect(await s.getMovements(card.id, '2026-10')).toHaveLength(1);
  });

  it('desfazer com id inválido falha', async () => {
    await expect(s.undoDeletion(999)).rejects.toThrow();
  });
});

describe('categorias', () => {
  it('cria, renomeia e conta as compras', async () => {
    const card = await newCard();
    const cat = (await s.createCategory({ name: 'Mercado' })) as { id: number };
    await s.updateCategory(cat.id, { name: 'Supermercado' });
    await s.createMovement(card.id, cat.id, { description: 'Feira', amount: 20, date: '2026-10-10' });
    expect(await s.getCategories()).toEqual([expect.objectContaining({ name: 'Supermercado', movementCount: 1 })]);
  });
});

describe('entradas, contas e caixa', () => {
  it('entrada recorrente: "só este mês" não altera os outros', async () => {
    const income = (await s.createIncome({ kind: 'salario', amount: 1000, date: '2026-10-05', recurring: true })) as { id: number };
    await s.updateIncome(income.id, '2026-11', 'month', { kind: 'salario', amount: 1500, date: '2026-11-05', recurring: true });
    expect((await s.getIncomes('2026-10')).totalAmount).toBe(1000);
    expect((await s.getIncomes('2026-11')).totalAmount).toBe(1500);
    expect((await s.getIncomes('2026-12')).totalAmount).toBe(1000);
  });

  it('entrada recorrente: "este e os próximos" altera daí em diante', async () => {
    const income = (await s.createIncome({ kind: 'salario', amount: 1000, date: '2026-10-05', recurring: true })) as { id: number };
    await s.updateIncome(income.id, '2026-11', 'forward', { kind: 'salario', amount: 1500, date: '2026-11-05', recurring: true });
    expect((await s.getIncomes('2026-10')).totalAmount).toBe(1000);
    expect((await s.getIncomes('2026-12')).totalAmount).toBe(1500);
  });

  it('o caixa do mês soma entradas, contas, gastos e cartões', async () => {
    const card = await newCard();
    await s.createIncome({ kind: 'salario', amount: 1000, date: '2026-10-05', recurring: false });
    await s.createBill({ name: 'Aluguel', amount: 300, date: '2026-10-08' });
    await s.createDailyExpense(null, { description: 'Lanche', amount: 50, date: '2026-10-09' });
    await s.createMovement(card.id, null, { description: 'Mercado', amount: 150, date: '2026-10-10' });
    expect(await s.getMonthCash('2026-10')).toMatchObject({
      incomeAmount: 1000, billsAmount: 300, dailyAmount: 50, cardsAmount: 150, resultAmount: 500,
    });
  });
});

describe('benefícios', () => {
  it('o gasto reduz o saldo disponível', async () => {
    const benefit = (await s.createBenefit({ name: 'VR', amount: 500, firstMonth: '2026-10' })) as { id: number };
    await s.createBenefitSpend(benefit.id, null, { description: 'Almoco', amount: 35, date: '2026-10-10' });
    const { items } = await s.getBenefits('2026-10');
    expect(items[0]).toMatchObject({ amount: 500, spentAmount: 35, availableAmount: 465 });
  });
});

describe('previsões', () => {
  const forecast = { kind: 'receive' as const, description: 'Freela', amount: 400, date: '2026-10-15', affects: false, recurring: false };

  it('lembrete não entra no caixa; "colocar no saldo" entra', async () => {
    const created = (await s.createForecast(forecast)) as { id: number };
    expect((await s.getMonthCash('2026-10')).incomeAmount).toBe(0);
    const [occurrence] = (await s.getForecasts('2026-10')).items;
    expect(occurrence).toMatchObject({ forecastId: created.id, state: 'reminder' });
    await s.putForecastInBalance(created.id, '2026-10');
    expect((await s.getMonthCash('2026-10')).incomeAmount).toBe(400);
  });

  it('previsão que afeta o saldo já entra no caixa', async () => {
    await s.createForecast({ ...forecast, affects: true });
    expect((await s.getMonthCash('2026-10')).incomeAmount).toBe(400);
  });

  it('previsão com data futura só entra quando a data chegar (RN-02)', async () => {
    await s.createForecast({ ...forecast, affects: true, date: '2026-10-20' });
    expect((await s.getMonthCash('2026-10')).incomeAmount).toBe(0);
    expect((await s.getForecasts('2026-10')).items[0].state).toBe('planned');
  });
});

describe('persistência', () => {
  it('recarrega os dados gravados', async () => {
    await newCard('Inter');
    vi.resetModules();
    s = await import('@/data/store');
    expect((await s.getCards('2026-10')).cards.map((c) => c.name)).toEqual(['Inter']);
  });

  it('grava no formato atual (v12)', async () => {
    await newCard();
    const raw = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? '').find((v) => v.includes('"version"'));
    expect(JSON.parse(raw ?? 'null')?.version).toBe(12);
  });
});
