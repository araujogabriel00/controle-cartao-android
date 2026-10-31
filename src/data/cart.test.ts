import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cenários de dados de specs/carrinho.md. Hoje é 15/10/2026, o cartão Nubank tem fatura de R$ 417,16 e o saldo é R$ 12.349,54.
type Store = typeof import('@/data/store');
let s: Store;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  s = await import('@/data/store');
});

type World = { card: number; vr: number; electronics: number; food: number };

// Cartão, categorias, o Vale-refeição dividido só em Alimentação com R$ 480,00 e renda para o saldo de R$ 12.349,54.
const world = async (): Promise<World> => {
  const card = (await s.saveCard({ name: 'Nubank' }, 'create')) as { id: number };
  const electronics = (await s.createCategory({ name: 'Eletrônicos' })) as { id: number };
  const food = (await s.createCategory({ name: 'Alimentação' })) as { id: number };
  await s.createMovement(card.id, null, { description: 'Compras do mês', amount: 417.16, date: '2026-10-10' });
  await s.createIncome({ kind: 'salario', amount: 12766.7, date: '2026-10-05', recurring: false });
  const vr = (await s.createBenefit({ name: 'Vale-refeição', amount: 480, firstMonth: '2026-10', split: [{ categoryId: food.id, amount: 480 }] })) as { id: number };
  return { card: card.id, vr: vr.id, electronics: electronics.id, food: food.id };
};

const fill = async (w: World) => {
  await s.addCartItem({ name: 'Fone de ouvido', price: 120, quantity: 1, categoryId: w.electronics });
  await s.addCartItem({ name: 'Arroz 5 kg', price: 32.9, quantity: 2, categoryId: w.food });
  await s.addCartItem({ name: 'Café', price: 18.5, quantity: 1, categoryId: w.food });
};

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');
const balance = async () => (await s.getMonthCash('2026-10')).balanceAmount;
const invoice = async (w: World) => (await s.getCard(w.card, '2026-10'))!.invoiceAmount;
const available = async (w: World) => (await s.getBenefits('2026-10')).items.find((b) => b.id === w.vr)!.availableAmount;

describe('produtos', () => {
  it('o carrinho começa vazio', async () => {
    expect(await s.getCart()).toEqual({ items: [], productCount: 0, itemCount: 0, total: 0 });
  });

  it('adicionar produtos: 4 itens, total R$ 204,30 e nada é lançado', async () => {
    const w = await world();
    const before = { balance: await balance(), invoice: await invoice(w), available: await available(w) };
    await fill(w);
    expect(await s.getCart()).toMatchObject({ productCount: 3, itemCount: 4, total: 204.3 });
    expect({ balance: await balance(), invoice: await invoice(w), available: await available(w) }).toEqual(before);
    expect((await s.getDailyExpenses('2026-10')).items).toEqual([]);
  });

  it('o total do produto é preço × quantidade e traz o nome da categoria', async () => {
    const w = await world();
    await fill(w);
    const { items } = await s.getCart();
    expect(items[1]).toMatchObject({ name: 'Arroz 5 kg', total: 65.8, categoryName: 'Alimentação', quantity: 2, price: 32.9 });
  });

  it('a ordem de inclusão é a ordem da lista', async () => {
    const w = await world();
    await fill(w);
    expect((await s.getCart()).items.map((i) => i.name)).toEqual(['Fone de ouvido', 'Arroz 5 kg', 'Café']);
  });

  it.each([
    ['nome vazio', { name: ' ', price: 10, quantity: 1, categoryId: null }],
    ['nome com mais de 120 caracteres', { name: 'a'.repeat(121), price: 10, quantity: 1, categoryId: null }],
    ['preço zero', { name: 'X', price: 0, quantity: 1, categoryId: null }],
    ['preço negativo', { name: 'X', price: -1, quantity: 1, categoryId: null }],
    ['quantidade zero', { name: 'X', price: 10, quantity: 0, categoryId: null }],
    ['quantidade 100', { name: 'X', price: 10, quantity: 100, categoryId: null }],
    ['quantidade fracionada', { name: 'X', price: 10, quantity: 1.5, categoryId: null }],
    ['loja com mais de 120 caracteres', { name: 'X', price: 10, quantity: 1, categoryId: null, store: 'l'.repeat(121) }],
    ['categoria inexistente', { name: 'X', price: 10, quantity: 1, categoryId: 999 }],
  ])('recusa %s e nada é salvo', async (_label, input) => {
    await expect(s.addCartItem(input)).rejects.toThrow();
    expect((await s.getCart()).items).toEqual([]);
  });

  it('aceita até 50 produtos', async () => {
    for (let i = 0; i < 50; i++) await s.addCartItem({ name: `P${i}`, price: 1, quantity: 1, categoryId: null });
    await expect(s.addCartItem({ name: 'P50', price: 1, quantity: 1, categoryId: null })).rejects.toThrow(/50/);
  });

  it('alterar a quantidade do Café para 2: R$ 37,00 no produto e R$ 222,80 no carrinho', async () => {
    const w = await world();
    await fill(w);
    const cafe = (await s.getCart()).items[2];
    await s.updateCartItem(cafe.id, { name: cafe.name, price: cafe.price, quantity: 2, categoryId: cafe.categoryId });
    const cart = await s.getCart();
    expect(cart.items[2].total).toBe(37);
    expect(cart.total).toBe(222.8);
  });

  it('a loja é só uma anotação', async () => {
    await s.addCartItem({ name: 'Fone', price: 10, quantity: 1, categoryId: null, store: ' https://loja.exemplo/fone ' });
    expect((await s.getCart()).items[0].store).toBe('https://loja.exemplo/fone');
  });

  it('remover e desfazer devolve o produto na mesma posição', async () => {
    const w = await world();
    await fill(w);
    const cafe = (await s.getCart()).items[1];
    const { undoId } = (await s.removeCartItem(cafe.id)) as { undoId: number };
    expect((await s.getCart()).items.map((i) => i.name)).toEqual(['Fone de ouvido', 'Café']);
    await s.undoDeletion(undoId);
    expect((await s.getCart()).items.map((i) => i.name)).toEqual(['Fone de ouvido', 'Arroz 5 kg', 'Café']);
  });

  it('esvaziar o carrinho', async () => {
    const w = await world();
    await fill(w);
    await s.clearCart();
    expect((await s.getCart()).productCount).toBe(0);
  });

  it('o carrinho sobrevive ao fechar o app', async () => {
    const w = await world();
    await fill(w);
    vi.resetModules();
    s = await import('@/data/store');
    expect((await s.getCart()).items.map((i) => i.name)).toEqual(['Fone de ouvido', 'Arroz 5 kg', 'Café']);
  });

  it('excluir uma categoria deixa o produto no carrinho, sem categoria', async () => {
    const w = await world();
    await fill(w);
    await s.deleteCategory(w.food);
    const { items } = await s.getCart();
    expect(items.map((i) => [i.name, i.categoryId])).toEqual([['Fone de ouvido', w.electronics], ['Arroz 5 kg', null], ['Café', null]]);
  });
});

describe('cobertura', () => {
  it('o Vale-refeição não cobre sozinho: R$ 84,30 de R$ 204,30', async () => {
    const w = await world();
    await fill(w);
    const coverage = await s.getCartCoverage();
    expect(coverage.total).toBe(204.3);
    expect(coverage.benefits).toEqual([expect.objectContaining({ id: w.vr, coverage: 84.3, available: 480, divided: true, canPayAlone: false })]);
    expect(coverage.balanceToday).toBe(12349.54);
    expect(coverage.cards).toEqual([expect.objectContaining({ id: w.card, name: 'Nubank', invoice: 417.16 })]);
  });

  it('um carrinho só de Alimentação de R$ 84,30 pode ser pago só pelo benefício', async () => {
    const w = await world();
    await s.addCartItem({ name: 'Arroz 5 kg', price: 32.9, quantity: 2, categoryId: w.food });
    await s.addCartItem({ name: 'Café', price: 18.5, quantity: 1, categoryId: w.food });
    expect((await s.getCartCoverage()).benefits[0]).toMatchObject({ coverage: 84.3, canPayAlone: true });
  });

  it('categoria fechada no benefício não é coberta', async () => {
    const w = await world();
    await fill(w);
    await s.closeBenefitCategory(w.vr, w.food, '2026-10');
    expect((await s.getCartCoverage()).benefits[0]).toMatchObject({ coverage: 0, canPayAlone: false });
  });

  it('o disponível da categoria limita a cobertura', async () => {
    const w = await world();
    await fill(w);
    await s.createBenefitSpend(w.vr, w.food, { description: 'Mercado', amount: 440, date: '2026-10-12' });
    expect((await s.getCartCoverage()).benefits[0]).toMatchObject({ coverage: 40, available: 40 });
  });

  it('benefício sem divisão cobre qualquer produto até o disponível', async () => {
    const w = await world();
    await fill(w);
    const open = (await s.createBenefit({ name: 'Vale-alimentação', amount: 100, firstMonth: '2026-10' })) as { id: number };
    const found = (await s.getCartCoverage()).benefits.find((b) => b.id === open.id)!;
    expect(found).toMatchObject({ divided: false, coverage: 100, canPayAlone: false });
  });

  it('benefício que ainda não começou não cobre nada', async () => {
    const w = await world();
    await fill(w);
    const later = (await s.createBenefit({ name: 'Futuro', amount: 500, firstMonth: '2026-12' })) as { id: number };
    expect((await s.getCartCoverage()).benefits.find((b) => b.id === later.id)!.coverage).toBe(0);
  });
});

describe('fechar o carrinho', () => {
  it('pagar no saldo: gastos do dia a dia de hoje, na categoria de cada produto', async () => {
    const w = await world();
    await fill(w);
    const before = await balance();
    const result = await s.checkoutCart({ forms: [{ kind: 'balance', amount: 204.3 }] });
    const { items } = await s.getDailyExpenses('2026-10');
    expect(items.map((i) => [i.description, i.amount, i.date, i.categoryId]).sort()).toEqual([
      ['Arroz 5 kg (2×)', 65.8, '2026-10-15', w.food], ['Café', 18.5, '2026-10-15', w.food], ['Fone de ouvido', 120, '2026-10-15', w.electronics],
    ]);
    expect(await balance()).toBe(Math.round((before - 204.3) * 100) / 100);
    expect((await s.getCart()).productCount).toBe(0);
    expect(result).toMatchObject({ total: 204.3, topArea: 'income', forms: [expect.objectContaining({ key: 'balance', name: 'Saldo da conta', amount: 204.3 })] });
  });

  it('pagar no cartão à vista: compras avulsas e a fatura passa de R$ 417,16 para R$ 621,46', async () => {
    const w = await world();
    await fill(w);
    await s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 204.3, installments: 1 }] });
    const movements = await s.getMovements(w.card, '2026-10');
    expect(movements.filter((m) => m.description !== 'Compras do mês').map((m) => [m.description, m.amount, m.date])).toEqual(
      expect.arrayContaining([['Fone de ouvido', 120, '2026-10-15'], ['Arroz 5 kg (2×)', 65.8, '2026-10-15'], ['Café', 18.5, '2026-10-15']]));
    expect(await invoice(w)).toBe(621.46);
  });

  it('pagar no cartão em 3x: cada produto vira uma compra parcelada com a 1.ª parcela em outubro', async () => {
    const w = await world();
    await fill(w);
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'card', id: w.card, amount: 204.3, installments: 3 }] });
    expect(preview).toMatchObject({ valid: true, forms: [expect.objectContaining({ perInstallment: 68.1, invoiceBefore: 417.16 })] });
    await s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 204.3, installments: 3 }] });
    const all = await s.getAllMovements(w.card);
    const parceladas = all.movements.filter((m) => m.purchase);
    expect(parceladas.map((m) => m.purchase!.installmentCount)).toEqual([3, 3, 3]);
    expect(all.planned.map((p) => p.installmentCount)).toEqual([3, 3, 3, 3, 3, 3]);
    // O resto dos centavos fica na 1.ª parcela de cada produto: 40,00 + 21,94 + 6,18.
    expect(await invoice(w)).toBe(485.28);
    expect(preview.forms[0].invoiceAfter).toBe(485.28);
  });

  it('pagar só com o benefício quando ele cobre o carrinho inteiro', async () => {
    const w = await world();
    await s.addCartItem({ name: 'Arroz 5 kg', price: 32.9, quantity: 2, categoryId: w.food });
    await s.addCartItem({ name: 'Café', price: 18.5, quantity: 1, categoryId: w.food });
    await s.checkoutCart({ forms: [{ kind: 'benefit', id: w.vr, amount: 84.3 }] });
    expect(await available(w)).toBe(395.7);
    const spends = (await s.getBenefits('2026-10')).items[0].spends;
    expect(spends.map((x) => [x.description, x.amount, x.categoryId])).toEqual(expect.arrayContaining([['Arroz 5 kg (2×)', 65.8, w.food], ['Café', 18.5, w.food]]));
  });

  it('dividir: Vale-refeição R$ 84,30 e cartão R$ 120,00 em 3x', async () => {
    const w = await world();
    await fill(w);
    const draft = { forms: [{ kind: 'benefit' as const, id: w.vr, amount: 84.3 }, { kind: 'card' as const, id: w.card, amount: 120, installments: 3 }] };
    const preview = await s.getCartPaymentPreview(draft);
    expect(preview).toMatchObject({ valid: true, left: 0, issues: [] });
    expect(preview.forms[0]).toMatchObject({ limit: 84.3, availableAfter: 395.7 });
    expect(preview.forms[1]).toMatchObject({ invoiceBefore: 417.16, invoiceAfter: 457.16, perInstallment: 40 });
    const result = await s.checkoutCart(draft);
    expect((await s.getBenefits('2026-10')).items[0].spends.map((x) => x.description).sort()).toEqual(['Arroz 5 kg (2×)', 'Café']);
    expect((await s.getAllMovements(w.card)).movements.filter((m) => m.purchase).map((m) => [m.description, m.purchase!.installmentCount])).toEqual([['Fone de ouvido', 3]]);
    expect(await available(w)).toBe(395.7);
    expect(await invoice(w)).toBe(457.16);
    expect(result.topArea).toBe('cards');
    expect(result.forms.map((f) => [f.name, f.amount, f.entries.length])).toEqual([['Vale-refeição', 84.3, 2], ['Nubank', 120, 1]]);
  });

  it('produto quebrado: R$ 50,00 no benefício e o resto no saldo', async () => {
    const w = await world();
    await fill(w);
    await s.checkoutCart({ forms: [{ kind: 'benefit', id: w.vr, amount: 50 }, { kind: 'balance', amount: 154.3 }] });
    const spends = (await s.getBenefits('2026-10')).items[0].spends;
    expect(spends.map((x) => [x.description, x.amount])).toEqual([['Arroz 5 kg (2×)', 50]]);
    const daily = (await s.getDailyExpenses('2026-10')).items.map((x) => [x.description, x.amount]);
    expect(daily).toEqual(expect.arrayContaining([['Fone de ouvido', 120], ['Arroz 5 kg (2×)', 15.8], ['Café', 18.5]]));
    expect(daily).toHaveLength(3);
  });

  it('o saldo de hoje não impede o fechamento: pode ficar negativo (D12)', async () => {
    const w = await world();
    await s.addCartItem({ name: 'Notebook', price: 20000, quantity: 1, categoryId: w.electronics });
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'balance', amount: 20000 }] });
    expect(preview).toMatchObject({ valid: true, balanceBefore: 12349.54, balanceAfter: -7650.46 });
    await s.checkoutCart({ forms: [{ kind: 'balance', amount: 20000 }] });
    expect(await balance()).toBe(-7650.46);
  });

  it('o resultado de fechar lista o que foi criado por forma', async () => {
    const w = await world();
    await fill(w);
    const result = await s.checkoutCart({ forms: [{ kind: 'benefit', id: w.vr, amount: 84.3 }, { kind: 'balance', amount: 120 }] });
    expect(result.forms.map((f) => f.area)).toEqual(['benefits', 'income']);
    expect(result.topArea).toBe('income');
  });
});

describe('divisões inválidas e falhas (RN-06, RN-09, RN-10)', () => {
  it('divisão que não fecha: mostra o que falta alocar', async () => {
    const w = await world();
    await fill(w);
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'benefit', id: w.vr, amount: 84.3 }, { kind: 'card', id: w.card, amount: 100, installments: 1 }] });
    expect(preview).toMatchObject({ valid: false, left: 20 });
    expect(preview.issues.map(plain)).toEqual(['Falta alocar R$ 20,00.']);
    expect(preview.forms.every((f) => f.invoiceAfter === null)).toBe(true);
  });

  it('divisão que passa do total', async () => {
    const w = await world();
    await fill(w);
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'balance', amount: 250 }] });
    expect(preview).toMatchObject({ valid: false, left: -45.7 });
    expect(preview.issues[0]).toMatch(/passa do total/);
  });

  it('benefício acima da cobertura mostra o limite', async () => {
    const w = await world();
    await fill(w);
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'benefit', id: w.vr, amount: 100 }, { kind: 'balance', amount: 104.3 }] });
    expect(preview.valid).toBe(false);
    expect(preview.forms[0].limit).toBe(84.3);
    expect(plain(preview.forms[0].issue)).toBe('Vale-refeição só cobre R$ 84,30 deste carrinho.');
  });

  it('benefício sozinho sem cobrir o total é recusado', async () => {
    const w = await world();
    await fill(w);
    await expect(s.checkoutCart({ forms: [{ kind: 'benefit', id: w.vr, amount: 204.3 }] })).rejects.toThrow(/só cobre/);
  });

  it('forma repetida e parcelas inválidas são recusadas', async () => {
    const w = await world();
    await fill(w);
    await expect(s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 100, installments: 1 }, { kind: 'card', id: w.card, amount: 104.3, installments: 1 }] })).rejects.toThrow(/mais de uma vez/);
    await expect(s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 204.3, installments: 4 }] })).rejects.toThrow(/1x, 2x/);
  });

  it('falha ao confirmar: benefício fechado em Alimentação, nada é criado e o carrinho continua cheio', async () => {
    const w = await world();
    await fill(w);
    const draft = { forms: [{ kind: 'benefit' as const, id: w.vr, amount: 84.3 }, { kind: 'card' as const, id: w.card, amount: 120, installments: 1 }] };
    expect((await s.getCartPaymentPreview(draft)).valid).toBe(true);
    await s.closeBenefitCategory(w.vr, w.food, '2026-10');
    await expect(s.checkoutCart(draft)).rejects.toMatchObject({ name: 'CartDraftError', message: expect.stringMatching(/Vale-refeição só cobre/) });
    expect((await s.getCart()).productCount).toBe(3);
    expect((await s.getBenefits('2026-10')).items[0].spends).toEqual([]);
    expect((await s.getMovements(w.card, '2026-10')).map((m) => m.description)).toEqual(['Compras do mês']);
  });

  it('cartão excluído entre a escolha e a confirmação volta para Dividir', async () => {
    const w = await world();
    await fill(w);
    await s.deleteCard(w.card);
    await expect(s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 204.3, installments: 1 }] })).rejects.toMatchObject({ name: 'CartDraftError', message: expect.stringMatching(/não existe mais/) });
    expect((await s.getCart()).productCount).toBe(3);
  });

  it('parcelas que deixam a parcela abaixo de R$ 0,01 não valem e nada é criado', async () => {
    const w = await world();
    await s.addCartItem({ name: 'Bala', price: 0.05, quantity: 1, categoryId: null });
    const preview = await s.getCartPaymentPreview({ forms: [{ kind: 'card', id: w.card, amount: 0.05, installments: 12 }] });
    expect(preview.valid).toBe(false);
    expect(preview.issues[0]).toMatch(/pelo menos/);
    await expect(s.checkoutCart({ forms: [{ kind: 'card', id: w.card, amount: 0.05, installments: 12 }] })).rejects.toThrow(/pelo menos/);
    expect((await s.getCart()).productCount).toBe(1);
    expect((await s.getAllMovements(w.card)).planned).toEqual([]);
  });

  it('carrinho vazio não fecha', async () => {
    await world();
    await expect(s.checkoutCart({ forms: [{ kind: 'balance', amount: 10 }] })).rejects.toMatchObject({ name: 'CartDraftError' });
  });
});

describe('sugerir divisão (D9)', () => {
  it('o Vale-refeição recebe R$ 84,30 e o cartão o resto', async () => {
    const w = await world();
    await fill(w);
    expect(await s.getCartSuggestion()).toEqual([{ kind: 'benefit', id: w.vr, amount: 84.3 }, { kind: 'card', id: w.card, amount: 120, installments: 1 }]);
  });

  it('a sugestão é uma divisão válida', async () => {
    const w = await world();
    await fill(w);
    expect((await s.getCartPaymentPreview({ forms: await s.getCartSuggestion() })).valid).toBe(true);
  });

  it('sem cartão o resto vai para o saldo', async () => {
    const w = await world();
    await fill(w);
    await s.deleteCard(w.card);
    expect(await s.getCartSuggestion()).toEqual([{ kind: 'benefit', id: w.vr, amount: 84.3 }, { kind: 'balance', amount: 120 }]);
  });
});

describe('migração v12 → v13', () => {
  it('abre os dados da v12 sem perda e com o carrinho vazio', async () => {
    await s.saveCard({ name: 'Inter' }, 'create');
    const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? '').includes('"version"'))!;
    const old = JSON.parse(localStorage.getItem(key)!);
    old.version = 12;
    delete old.cartItems;
    localStorage.setItem(key, JSON.stringify(old));
    vi.resetModules();
    s = await import('@/data/store');
    expect((await s.getCards('2026-10')).cards.map((c) => c.name)).toEqual(['Inter']);
    expect((await s.getCart()).items).toEqual([]);
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ version: 13, cartItems: [] }));
  });
});
