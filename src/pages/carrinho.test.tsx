import { describe, expect, it, vi } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { withCart, withShop } from '@/test/seeds';

// Cenários de specs/carrinho.md seção 5. Hoje é 15/10/2026; o saldo é R$ 12.349,54 e a fatura do Nubank, R$ 417,16.
const balance = async (store: Store) => (await store.getMonthCash('2026-10')).balanceAmount;
const invoice = async (store: Store, card: number) => (await store.getCard(card, '2026-10'))!.invoiceAmount;
const names = async (store: Store) => (await store.getCart()).items.map((i) => i.name);

type App = Awaited<ReturnType<typeof openApp>>;
// Do carrinho cheio até "Como vai pagar?".
const toPayment = async (app: App) => { await app.user.click(await app.screen.findByTestId('button-close-cart')); await app.screen.findByTestId('text-pay-total'); };
const confirm = async (app: App) => {
  await app.user.click(await app.screen.findByTestId('button-confirm-purchase'));
  return app.screen.findByTestId('screen-cart-done');
};
const payWith = async (app: App, option: string) => {
  await toPayment(app);
  await app.user.click(await app.screen.findByTestId(option));
  await app.waitFor(() => expect(app.screen.getByTestId('button-continue-single')).toBeEnabled());
  await app.user.click(app.screen.getByTestId('button-continue-single'));
};

describe('Carrinho: produtos', () => {
  it('carrinho vazio: pelo menu ⋯ chega em "Seu carrinho está vazio"', async () => {
    const { user, screen, waitFor } = await openApp('#/', withShop);
    await user.click(await screen.findByTestId('button-header-menu'));
    await user.click(await screen.findByTestId('menu-cart'));
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
    expect(await screen.findByText('Seu carrinho está vazio')).toBeInTheDocument();
    expect(screen.getByTestId('button-add-product')).toBeInTheDocument();
  });

  it('adicionar produtos pelo formulário: 4 itens, R$ 204,30 e nada é lançado', async () => {
    const { user, screen, store } = await openApp('#/carrinho/produto', withShop);
    const before = await balance(store);
    const add = async (name: string, price: string, qty: string, category: string, more: boolean) => {
      await user.type(await screen.findByTestId('input-product-name'), name);
      await user.type(screen.getByTestId('input-product-price'), price);
      const quantity = screen.getByTestId('input-product-qty');
      await user.clear(quantity);
      await user.type(quantity, qty);
      await user.selectOptions(screen.getByTestId('select-product-category'), category);
      await user.click(screen.getByTestId(more ? 'button-save-product-more' : 'button-save-product'));
    };
    await add('Fone de ouvido', '120', '1', 'Eletrônicos', true);
    expect(await screen.findByTestId('text-product-added')).toBeInTheDocument();
    expect(screen.getByTestId('input-product-name')).toHaveValue('');
    await add('Arroz 5 kg', '32.90', '2', 'Alimentação', true);
    await screen.findByTestId('text-product-added');
    await add('Café', '18.50', '1', 'Alimentação', false);
    expect(plain((await screen.findByTestId('text-cart-total')).textContent)).toBe('R$ 204,30');
    expect(screen.getByText(/Total · 4 itens/)).toBeInTheDocument();
    expect(await balance(store)).toBe(before);
    expect((await store.getDailyExpenses('2026-10')).items).toEqual([]);
  });

  it('validar o produto: preço zero mostra o erro e nada é salvo', async () => {
    const { screen, store } = await openApp('#/carrinho/produto', withShop);
    const { fireEvent } = await import('@testing-library/react');
    await (await import('@testing-library/user-event')).default.setup().type(await screen.findByTestId('input-product-name'), 'Fone');
    fireEvent.change(screen.getByTestId('input-product-price'), { target: { value: '0' } });
    fireEvent.submit(screen.getByTestId('form-product'));
    expect(await screen.findByTestId('text-form-error')).toHaveTextContent(/preço deve ser maior que zero/i);
    expect((await store.getCart()).items).toEqual([]);
  });

  it('alterar a quantidade do Café para 2: R$ 222,80 no carrinho', async () => {
    const { user, screen, store } = await openApp('#/carrinho', withCart);
    const cafe = (await store.getCart()).items[2];
    await user.click(await screen.findByTestId(`button-cart-plus-${cafe.id}`));
    await screen.findByText('R$ 222,80', { exact: false });
    expect(plain(screen.getByTestId(`text-cart-item-total-${cafe.id}`).textContent)).toBe('R$ 37,00');
    expect(plain(screen.getByTestId('text-cart-total').textContent)).toBe('R$ 222,80');
  });

  it('remover e desfazer: o Café volta na mesma posição', async () => {
    const { user, screen, store } = await openApp('#/carrinho', withCart);
    const [, arroz, cafe] = (await store.getCart()).items;
    await user.click(await screen.findByTestId(`button-cart-remove-${arroz.id}`));
    await waitForGone(screen, `row-cart-${arroz.id}`);
    await user.click(await screen.findByTestId('button-undo'));
    await screen.findByTestId(`row-cart-${arroz.id}`);
    expect(await names(store)).toEqual(['Fone de ouvido', 'Arroz 5 kg', 'Café']);
    expect(cafe.name).toBe('Café');
  });

  it('editar um produto pelo formulário', async () => {
    const { user, screen, store, waitFor } = await openApp('#/carrinho', withCart);
    const cafe = (await store.getCart()).items[2];
    await user.click(await screen.findByRole('button', { name: 'Editar Café' }));
    await waitFor(() => expect(window.location.hash).toBe(`#/carrinho/produto/${cafe.id}`));
    const price = await screen.findByTestId('input-product-price');
    expect(price).toHaveValue(18.5);
    await user.clear(price);
    await user.type(price, '20');
    await user.click(screen.getByTestId('button-save-product'));
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
    expect((await store.getCart()).items[2].price).toBe(20);
  });

  it('remover pelo formulário de edição também oferece Desfazer', async () => {
    const { user, screen, store } = await openApp('#/carrinho', withCart);
    const cafe = (await store.getCart()).items[2];
    window.location.hash = `#/carrinho/produto/${cafe.id}`;
    await user.click(await screen.findByTestId('button-remove-product'));
    await user.click(await screen.findByTestId('button-undo'));
    await vi.waitFor(async () => expect(await names(store)).toEqual(['Fone de ouvido', 'Arroz 5 kg', 'Café']));
  });

  it('excluir uma categoria deixa o produto no carrinho, sem categoria', async () => {
    const { screen, store } = await openApp('#/carrinho', withCart);
    const world = (await store.getCategories()).find((c) => c.name === 'Alimentação')!;
    await screen.findByText(/Alimentação · R\$ 18,50/);
    await store.deleteCategory(world.id);
    // Sai e volta ao carrinho, como a pessoa faria: a tela lê de novo ao abrir.
    window.location.hash = '#/categorias';
    await screen.findByTestId('list-categories');
    window.location.hash = '#/carrinho';
    expect(await screen.findAllByText(/Sem categoria · /)).toHaveLength(2);
    expect((await store.getCart()).items.map((i) => i.categoryId)).toEqual([expect.any(Number), null, null]);
  });

  it('esvaziar o carrinho pede confirmação', async () => {
    const { user, screen, store } = await openApp('#/carrinho', withCart);
    await user.click(await screen.findByTestId('button-cart-menu'));
    await user.click(await screen.findByTestId('button-empty-cart'));
    await user.click(await screen.findByTestId('button-confirm-ok'));
    expect(await screen.findByText('Seu carrinho está vazio')).toBeInTheDocument();
    expect(await names(store)).toEqual([]);
  });

  it('cancelar a confirmação mantém os produtos', async () => {
    const { user, screen, store } = await openApp('#/carrinho', withCart);
    await user.click(await screen.findByTestId('button-cart-menu'));
    await user.click(await screen.findByTestId('button-empty-cart'));
    await user.click(await screen.findByTestId('button-confirm-cancel'));
    expect(await names(store)).toHaveLength(3);
  });
});

const waitForGone = async (screen: App['screen'], testId: string) => {
  await vi.waitFor(() => expect(screen.queryByTestId(testId)).not.toBeInTheDocument());
};

describe('Início e rotas', () => {
  it('barra no Início: "Carrinho · 4 itens" com o total, e abre o carrinho', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCart);
    const bar = await screen.findByTestId('bar-home-cart');
    expect(plain(bar.textContent)).toContain('Carrinho · 4 itens');
    expect(plain(bar.textContent)).toContain('R$ 204,30');
    await user.click(bar);
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
  });

  it('a barra não aparece com o carrinho vazio e o menu mostra a quantidade só quando há produtos', async () => {
    const empty = await openApp('#/', withShop);
    await empty.screen.findByTestId('text-home-balance');
    expect(empty.screen.queryByTestId('bar-home-cart')).not.toBeInTheDocument();
    await empty.user.click(empty.screen.getByTestId('button-header-menu'));
    expect(await empty.screen.findByTestId('menu-cart')).toBeInTheDocument();
    expect(empty.screen.queryByTestId('text-menu-cart-count')).not.toBeInTheDocument();
  });

  it('o menu ⋯ mostra a quantidade de itens', async () => {
    const { user, screen } = await openApp('#/', withCart);
    await user.click(await screen.findByTestId('button-header-menu'));
    expect(await screen.findByTestId('text-menu-cart-count')).toHaveTextContent('4');
  });

  it('sem rascunho, as telas do fechamento voltam para o carrinho', async () => {
    for (const path of ['#/carrinho/dividir', '#/carrinho/confirmar', '#/carrinho/ok']) {
      const { waitFor, unmount } = await openApp(path, withCart);
      await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
      unmount();
    }
  });

  it('carrinho vazio volta de Pagamento para o carrinho', async () => {
    const { waitFor } = await openApp('#/carrinho/pagamento', withShop);
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
  });

  it('id de produto inválido volta para o carrinho', async () => {
    const { waitFor } = await openApp('#/carrinho/produto/abc', withCart);
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
    window.location.hash = '#/carrinho/produto/999';
    await waitFor(() => expect(window.location.hash).toBe('#/carrinho'));
  });
});

describe('Pagamento com uma forma só', () => {
  it('pagar no saldo: 3 gastos do dia a dia e o carrinho esvazia', async () => {
    const app = await openApp('#/carrinho', withCart);
    const before = await balance(app.store);
    await payWith(app, 'option-pay-balance');
    expect(plain((await app.screen.findByTestId('text-confirm-total')).textContent)).toBe('R$ 204,30');
    await confirm(app);
    expect((await app.store.getDailyExpenses('2026-10')).items.map((i) => i.description).sort()).toEqual(['Arroz 5 kg (2×)', 'Café', 'Fone de ouvido']);
    expect(await balance(app.store)).toBe(Math.round((before - 204.3) * 100) / 100);
    expect(await names(app.store)).toEqual([]);
    expect(plain(app.screen.getByTestId('text-done-total').textContent)).toBe('R$ 204,30');
  });

  it('o saldo da conta mostra "fica R$ X depois"', async () => {
    const app = await openApp('#/carrinho', withCart);
    await toPayment(app);
    expect(plain((await app.screen.findByTestId('option-pay-balance')).textContent)).toContain('fica R$ 12.145,24 depois');
  });

  it('pagar no cartão à vista: a fatura passa de R$ 417,16 para R$ 621,46', async () => {
    const app = await openApp('#/carrinho', withCart);
    await payWith(app, `option-pay-card-${(await app.store.getCards('2026-10')).cards[0].id}`);
    await confirm(app);
    expect(await invoice(app.store, (await app.store.getCards('2026-10')).cards[0].id)).toBe(621.46);
  });

  it('pagar no cartão em 3x: mostra "3x de R$ 68,10" e a fatura, e cada produto vira compra parcelada', async () => {
    const app = await openApp('#/carrinho', withCart);
    const card = (await app.store.getCards('2026-10')).cards[0].id;
    await toPayment(app);
    await app.user.click(await app.screen.findByTestId(`option-pay-card-${card}`));
    await app.user.click(await app.screen.findByTestId('chip-installments-3'));
    const effect = await app.screen.findByTestId('text-pay-effect');
    await vi.waitFor(() => expect(plain(effect.textContent)).toContain('3x de R$ 68,10'));
    expect(plain(effect.textContent)).toContain('passa de R$ 417,16 para R$ 485,28');
    await app.user.click(app.screen.getByTestId('button-continue-single'));
    await confirm(app);
    expect((await app.store.getAllMovements(card)).movements.filter((m) => m.purchase).map((m) => m.purchase!.installmentCount)).toEqual([3, 3, 3]);
    expect(await invoice(app.store, card)).toBe(485.28);
  });

  it('benefício que não cobre sozinho aparece desativado com o motivo', async () => {
    const app = await openApp('#/carrinho', withCart);
    await toPayment(app);
    const option = await app.screen.findByTestId(/^option-pay-benefit-/);
    expect(option).toBeDisabled();
    expect(plain(option.textContent)).toContain('Cobre R$ 84,30 de R$ 204,30');
  });

  it('benefício que cobre sozinho pode ser escolhido', async () => {
    const app = await openApp('#/carrinho', async (s) => {
      const world = await withShop(s);
      await s.addCartItem({ name: 'Arroz 5 kg', price: 32.9, quantity: 2, categoryId: world.food });
      await s.addCartItem({ name: 'Café', price: 18.5, quantity: 1, categoryId: world.food });
    });
    await toPayment(app);
    const option = await app.screen.findByTestId(/^option-pay-benefit-/);
    expect(option).toBeEnabled();
    await app.user.click(option);
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-single')).toBeEnabled());
    await app.user.click(app.screen.getByTestId('button-continue-single'));
    await confirm(app);
    expect((await app.store.getBenefits('2026-10')).items[0].availableAmount).toBe(395.7);
  });

  it('saldo negativo: avisa "Deixa o saldo negativo" e deixa continuar', async () => {
    const app = await openApp('#/carrinho', async (s) => { const w = await withShop(s); await s.addCartItem({ name: 'Notebook', price: 20000, quantity: 1, categoryId: w.electronics }); });
    await toPayment(app);
    expect(await app.screen.findByTestId('text-balance-warning')).toHaveTextContent('Deixa o saldo negativo');
    await app.user.click(app.screen.getByTestId('option-pay-balance'));
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-single')).toBeEnabled());
    await app.user.click(app.screen.getByTestId('button-continue-single'));
    expect(await app.screen.findByText(/Deixa o saldo negativo/)).toBeInTheDocument();
  });

  it('o botão Continuar só ativa depois de escolher uma forma', async () => {
    const app = await openApp('#/carrinho', withCart);
    await toPayment(app);
    expect(app.screen.getByTestId('button-continue-single')).toBeDisabled();
  });
});

describe('Dividir', () => {
  const toSplit = async (app: App) => { await toPayment(app); await app.user.click(await app.screen.findByTestId('button-split-payment')); await app.screen.findByTestId('text-left-to-allocate'); };
  const addOrigin = async (app: App, key: string) => { await app.user.click(app.screen.getByTestId('button-add-origin')); await app.user.click(await app.screen.findByTestId(`add-origin-${key}`)); };

  it('dividir pagamento: R$ 84,30 no Vale-refeição e R$ 120,00 no cartão em 3x, e confirmar mostra o que muda', async () => {
    const app = await openApp('#/carrinho', withCart);
    const world = { vr: (await app.store.getBenefits('2026-10')).items[0].id, card: (await app.store.getCards('2026-10')).cards[0].id };
    await toSplit(app);
    expect(plain(app.screen.getByTestId('text-left-to-allocate').textContent)).toContain('Falta alocar R$ 204,30');
    await addOrigin(app, `benefit-${world.vr}`);
    expect(app.screen.getByTestId(`input-alloc-benefit-${world.vr}`)).toHaveValue(84.3);
    await addOrigin(app, `card-${world.card}`);
    expect(app.screen.getByTestId(`input-alloc-card-${world.card}`)).toHaveValue(120);
    await app.user.click(app.screen.getByTestId('chip-installments-3'));
    await vi.waitFor(() => expect(plain(app.screen.getByTestId('text-left-to-allocate').textContent)).toContain('Falta alocar R$ 0,00'));
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-payment')).toBeEnabled());
    await app.user.click(app.screen.getByTestId('button-continue-payment'));
    const changes = await app.screen.findByTestId('list-confirm-changes');
    await vi.waitFor(() => expect(plain(changes.textContent)).toContain('Disponível fica R$ 395,70'));
    expect(plain(changes.textContent)).toContain('passa de R$ 417,16 para R$ 457,16');
    await confirm(app);
    expect((await app.store.getBenefits('2026-10')).items[0].spends.map((x) => x.description).sort()).toEqual(['Arroz 5 kg (2×)', 'Café']);
    expect((await app.store.getAllMovements(world.card)).movements.filter((m) => m.purchase).map((m) => [m.description, m.purchase!.installmentCount])).toEqual([['Fone de ouvido', 3]]);
    // "Compra registrada" lista por forma e "Ver lançamentos" abre a aba da forma com mais valor (o cartão, R$ 120,00).
    expect(app.screen.getByTestId(`done-card-${world.card}`)).toHaveTextContent('Fone de ouvido');
    expect(app.screen.getByTestId(`done-benefit-${world.vr}`)).toHaveTextContent('Arroz 5 kg (2×)');
    await app.user.click(app.screen.getByTestId('button-see-entries'));
    await app.waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
  });

  it('sugerir divisão: o Vale-refeição recebe R$ 84,30 e o cartão o resto', async () => {
    const app = await openApp('#/carrinho', withCart);
    const ids = { vr: (await app.store.getBenefits('2026-10')).items[0].id, card: (await app.store.getCards('2026-10')).cards[0].id };
    await toSplit(app);
    await app.user.click(app.screen.getByTestId('button-suggest-split'));
    expect(await app.screen.findByTestId(`input-alloc-benefit-${ids.vr}`)).toHaveValue(84.3);
    expect(app.screen.getByTestId(`input-alloc-card-${ids.card}`)).toHaveValue(120);
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-payment')).toBeEnabled());
  });

  it('divisão que não fecha: mostra a diferença e Continuar fica desativado', async () => {
    const app = await openApp('#/carrinho', withCart);
    const card = (await app.store.getCards('2026-10')).cards[0].id;
    await toSplit(app);
    await addOrigin(app, `card-${card}`);
    const input = app.screen.getByTestId(`input-alloc-card-${card}`);
    await app.user.clear(input);
    await app.user.type(input, '100');
    expect(plain(app.screen.getByTestId('text-left-to-allocate').textContent)).toContain('Falta alocar R$ 104,30');
    expect(app.screen.getByTestId('button-continue-payment')).toBeDisabled();
  });

  it('benefício acima da cobertura: avisa o limite de R$ 84,30 e Continuar fica desativado', async () => {
    const app = await openApp('#/carrinho', withCart);
    const ids = { vr: (await app.store.getBenefits('2026-10')).items[0].id };
    await toSplit(app);
    await addOrigin(app, `benefit-${ids.vr}`);
    await addOrigin(app, 'balance');
    const input = app.screen.getByTestId(`input-alloc-benefit-${ids.vr}`);
    await app.user.clear(input);
    await app.user.type(input, '100');
    await app.user.clear(app.screen.getByTestId('input-alloc-balance'));
    await app.user.type(app.screen.getByTestId('input-alloc-balance'), '104.30');
    const issue = await app.screen.findByTestId(`text-origin-issue-benefit-${ids.vr}`);
    expect(plain(issue.textContent)).toContain('só cobre R$ 84,30');
    expect(app.screen.getByTestId('button-continue-payment')).toBeDisabled();
  });

  it('produto quebrado: R$ 50,00 no benefício e o resto no saldo', async () => {
    const app = await openApp('#/carrinho', withCart);
    const ids = { vr: (await app.store.getBenefits('2026-10')).items[0].id };
    await toSplit(app);
    await addOrigin(app, `benefit-${ids.vr}`);
    const input = app.screen.getByTestId(`input-alloc-benefit-${ids.vr}`);
    await app.user.clear(input);
    await app.user.type(input, '50');
    await addOrigin(app, 'balance');
    expect(app.screen.getByTestId('input-alloc-balance')).toHaveValue(154.3);
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-payment')).toBeEnabled());
    await app.user.click(app.screen.getByTestId('button-continue-payment'));
    await confirm(app);
    expect((await app.store.getBenefits('2026-10')).items[0].spends.map((x) => [x.description, x.amount])).toEqual([['Arroz 5 kg (2×)', 50]]);
    const daily = (await app.store.getDailyExpenses('2026-10')).items.map((x) => [x.description, x.amount]);
    expect(daily).toEqual(expect.arrayContaining([['Fone de ouvido', 120], ['Arroz 5 kg (2×)', 15.8], ['Café', 18.5]]));
  });

  it('remover uma forma devolve o valor para "Falta alocar"', async () => {
    const app = await openApp('#/carrinho', withCart);
    const card = (await app.store.getCards('2026-10')).cards[0].id;
    await toSplit(app);
    await addOrigin(app, `card-${card}`);
    expect(plain(app.screen.getByTestId('text-left-to-allocate').textContent)).toContain('Falta alocar R$ 0,00');
    await app.user.click(app.screen.getByTestId(`button-remove-form-card-${card}`));
    expect(plain(app.screen.getByTestId('text-left-to-allocate').textContent)).toContain('Falta alocar R$ 204,30');
  });

  it('falha ao confirmar: benefício fechado antes de confirmar volta para Dividir, sem criar nada', async () => {
    const app = await openApp('#/carrinho', withCart);
    const ids = { vr: (await app.store.getBenefits('2026-10')).items[0].id, food: (await app.store.getCategories()).find((c) => c.name === 'Alimentação')!.id };
    await toSplit(app);
    await app.user.click(app.screen.getByTestId('button-suggest-split'));
    await vi.waitFor(() => expect(app.screen.getByTestId('button-continue-payment')).toBeEnabled());
    await app.user.click(app.screen.getByTestId('button-continue-payment'));
    await app.screen.findByTestId('list-confirm-changes');
    await app.store.closeBenefitCategory(ids.vr, ids.food, '2026-10');
    await app.user.click(app.screen.getByTestId('button-confirm-purchase'));
    expect(await app.screen.findByTestId('text-split-warning')).toHaveTextContent(/só cobre/);
    expect(window.location.hash).toBe('#/carrinho/dividir');
    expect(await names(app.store)).toHaveLength(3);
    expect((await app.store.getBenefits('2026-10')).items[0].spends).toEqual([]);
  });

  it('Voltar e ajustar leva de volta para a tela anterior', async () => {
    const app = await openApp('#/carrinho', withCart);
    await payWith(app, 'option-pay-balance');
    await app.user.click(await app.screen.findByTestId('button-back-adjust'));
    await app.waitFor(() => expect(window.location.hash).toBe('#/carrinho/pagamento'));
  });
});

describe('Olho e falha de leitura', () => {
  it('olho fechado: preços e totais mascarados e o campo de preço continua editável', async () => {
    const { user, screen } = await openApp('#/', withCart);
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = '#/carrinho';
    expect(await screen.findByTestId('text-cart-total')).toHaveTextContent('R$ ••••');
    expect(screen.getByTestId('list-cart')).not.toHaveTextContent('120,00');
    window.location.hash = '#/carrinho/produto';
    const price = await screen.findByTestId('input-product-price');
    await user.type(price, '15');
    expect(price).toHaveValue(15);
  });

  it('falha ao ler o carrinho: erro com "Tentar de novo" e o Início não mostra a barra', async () => {
    const { user, screen } = await openApp('#/carrinho', async (s) => {
      await withCart(s);
      const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? '').includes('"version"'))!;
      const state = JSON.parse(localStorage.getItem(key)!);
      state.cartItems = 'quebrado';
      localStorage.setItem(key, JSON.stringify(state));
      // O app que abre em seguida importa o store de novo e lê o estado quebrado.
      vi.resetModules();
    });
    expect(await screen.findByTestId('text-cart-error')).toHaveTextContent('Tentar de novo');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByTestId('text-cart-error')).toBeInTheDocument();
    window.location.hash = '#/';
    expect(await screen.findByTestId('text-home-balance')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-home-cart')).not.toBeInTheDocument();
  });
});

