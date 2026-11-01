import { describe, expect, it, vi } from 'vitest';
import { openApp, plain, type Store } from '@/test/app';
import { newDream, withCash, withRenda, withThreeDreams } from '@/test/seeds';

// Cenários de specs/sonhos.md seção 5. Hoje é 15/10/2026; a renda é R$ 4.527,00.
const idOf = async (store: Store, name: string) => (await store.getDreams()).items.find((i) => i.name === name)!.id;
const balance = async (store: Store) => (await store.getMonthCash('2026-10')).balanceAmount;

// Abre a caixinha de um sonho pelo endereço (o id só existe depois de semear).
const openDream = async (name: string, seed: (s: Store) => Promise<unknown>, tail = '') => {
  const app = await openApp('#/sonhos', seed);
  const id = await idOf(app.store, name);
  window.location.hash = `#/sonhos/${id}${tail}`;
  return { ...app, id };
};

const deposit = async (app: Awaited<ReturnType<typeof openDream>>, amount: string) => {
  await app.user.click(await app.screen.findByTestId('button-save-money'));
  const input = await app.screen.findByTestId('input-save-amount');
  await app.user.clear(input);
  await app.user.type(input, amount);
  await app.user.click(app.screen.getByTestId('button-save-confirm'));
};

describe('Meus sonhos', () => {
  it('estado vazio: pelo menu ⋯ chega em "Criar meu primeiro sonho"', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCash);
    await user.click(await screen.findByTestId('button-header-menu'));
    await user.click(await screen.findByTestId('menu-dreams'));
    await waitFor(() => expect(window.location.hash).toBe('#/sonhos'));
    expect(await screen.findByRole('button', { name: /Criar meu primeiro sonho/ })).toBeInTheDocument();
  });

  // Criar, salvar o plano, excluir e fechar uma conquista voltam à lista sem empilhar outra entrada: o "Voltar" da lista sai de Sonhos.
  it('depois de criar um sonho o "Voltar" da lista leva ao Início, sem reabrir o formulário', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCash);
    await user.click(await screen.findByTestId('button-header-menu'));
    await user.click(await screen.findByTestId('menu-dreams'));
    await user.click(await screen.findByTestId('button-new-dream'));
    await user.type(await screen.findByTestId('input-dream-name'), 'Viagem');
    await user.type(screen.getByTestId('input-dream-goal'), '1000');
    await user.click(screen.getByTestId('button-save-dream'));
    await screen.findByTestId('list-dreams');
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('depois de salvar o plano o "Voltar" da lista leva ao Início', async () => {
    const { user, screen, waitFor } = await openApp('#/', async (s) => { await withThreeDreams(s, 0); });
    await user.click(await screen.findByTestId('button-header-menu'));
    await user.click(await screen.findByTestId('menu-dreams'));
    await user.click(await screen.findByTestId('button-adjust-plan'));
    await user.click(await screen.findByTestId('button-plan-chip-20'));
    await user.click(screen.getByTestId('button-save-plan'));
    await screen.findByTestId('list-dreams');
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('depois de abrir e voltar de uma caixinha o "Voltar" da lista leva ao Início', async () => {
    const { user, screen, waitFor } = await openApp('#/', async (s) => { await withThreeDreams(s); });
    await user.click(await screen.findByTestId('button-header-menu'));
    await user.click(await screen.findByTestId('menu-dreams'));
    await user.click((await screen.findAllByTestId(/^row-dream-\d+$/))[0]);
    await user.click(await screen.findByTestId('button-back'));
    await screen.findByTestId('list-dreams');
    await user.click(screen.getByTestId('button-back'));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('criar um sonho: aparece com 24% e o saldo não muda', async () => {
    const { user, screen, store } = await openApp('#/sonhos', withRenda);
    const before = await balance(store);
    await user.click(await screen.findByTestId('button-new-dream'));
    await user.type(await screen.findByTestId('input-dream-name'), 'Viagem ao Japão');
    await user.type(screen.getByTestId('input-dream-goal'), '18000');
    await user.type(screen.getByTestId('input-dream-initial'), '4320');
    await user.click(screen.getByTestId('button-dream-icon-plane'));
    await user.click(screen.getByTestId('button-save-dream'));
    const row = await screen.findByTestId(/^row-dream-/);
    expect(plain(row.textContent)).toContain('R$ 4.320,00 de R$ 18.000,00');
    expect(row).toHaveTextContent('24%');
    expect(await balance(store)).toBe(before);
  });

  it('validar o novo sonho: guardado igual à meta mostra o erro e nada é salvo', async () => {
    const { user, screen, store } = await openApp('#/sonhos/novo', withRenda);
    await user.type(await screen.findByTestId('input-dream-name'), 'Carro');
    await user.type(screen.getByTestId('input-dream-goal'), '1000');
    await user.type(screen.getByTestId('input-dream-initial'), '1000');
    await user.click(screen.getByTestId('button-save-dream'));
    expect(await screen.findByTestId('text-form-error')).toHaveTextContent(/menor que a meta/i);
    expect((await store.getDreams()).items).toEqual([]);
  });

  it('o novo sonho mostra a previsão na hora', async () => {
    const { user, screen } = await openApp('#/sonhos/novo', async (s) => { await withThreeDreams(s); });
    await user.type(await screen.findByTestId('input-dream-goal'), '9060');
    await user.clear(screen.getByTestId('input-dream-share'));
    await user.type(screen.getByTestId('input-dream-share'), '25');
    // 4.527 x 20% x 25% = R$ 226,35 por mês; 9.060 / 226,35 = 40,03, ou seja, 41 meses a partir de out/2026.
    expect(screen.getByTestId('text-dream-preview')).toHaveTextContent('mar/2030');
  });

  it('mostra o plano, o guardado do mês e uma linha por sonho, com os conquistados no fim', async () => {
    const { screen } = await openApp('#/sonhos', async (s) => {
      const { notebook } = await withThreeDreams(s);
      await s.depositDream(notebook.id, 100);
    });
    expect(plain((await screen.findByTestId('text-dreams-month')).textContent)).toContain('guardou R$ 100,00 de R$ 905,40');
    expect(screen.getByTestId('card-dreams-plan')).toHaveTextContent('20%');
    expect(screen.getByTestId('list-dreams')).toHaveTextContent('Viagem ao Japão');
    expect(screen.getByTestId('list-dreams')).not.toHaveTextContent('Notebook novo');
    expect(screen.getByTestId('list-dreams-done')).toHaveTextContent('Notebook novo');
  });

  it('com retiradas maiores que os aportes a frase diz "retirou", sem valor negativo', async () => {
    const { screen } = await openApp('#/sonhos', async (s) => {
      const { japan } = await withThreeDreams(s);
      await s.withdrawDream(japan.id, 500);
    });
    const text = plain((await screen.findByTestId('text-dreams-month')).textContent);
    expect(text).toContain('retirou R$ 500,00 das caixinhas');
    expect(text).not.toContain('-R$');
  });

  it('com 80% ou mais o sonho leva "Quase lá"', async () => {
    const { screen } = await openApp('#/sonhos', async (s) => { await withRenda(s); await newDream(s, 'Quase', 1000, 100, 850); });
    expect(await screen.findByText('Quase lá')).toBeInTheDocument();
  });

  it('endereços de sonho inválidos voltam para a lista', async () => {
    const { waitFor } = await openApp('#/sonhos/abc', withRenda);
    await waitFor(() => expect(window.location.hash).toBe('#/sonhos'));
    window.location.hash = '#/sonhos/999';
    await waitFor(() => expect(window.location.hash).toBe('#/sonhos'));
  });
});

describe('Plano', () => {
  it('dividir o plano: 20% dá R$ 905,40 por mês, total 100% e Salvar plano ativo', async () => {
    // Entra pela lista (como a pessoa): salvar desempilha o plano e volta a ela.
    const { user, screen, store } = await openApp('#/sonhos', async (s) => { await withThreeDreams(s, 0); });
    await user.click(await screen.findByTestId('button-adjust-plan'));
    await user.click(await screen.findByTestId('button-plan-chip-20'));
    expect(plain(screen.getByTestId('text-plan-monthly').textContent)).toContain('R$ 905,40 por mês');
    expect(screen.getByTestId('text-plan-total')).toHaveTextContent('Total: 100%');
    const save = screen.getByTestId('button-save-plan');
    expect(save).toBeEnabled();
    await user.click(save);
    await screen.findByTestId('list-dreams');
    expect((await store.getDreamPlan()).percent).toBe(20);
  });

  it('o controle deslizante muda o percentual', async () => {
    const { screen } = await openApp('#/sonhos/plano', async (s) => { await withThreeDreams(s); });
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(await screen.findByTestId('slider-plan-percent'), { target: { value: '30' } });
    expect(screen.getByTestId('text-plan-percent')).toHaveTextContent('30%');
    expect(plain(screen.getByTestId('text-plan-monthly').textContent)).toContain('R$ 1.358,10 por mês');
  });

  it('divisão que não fecha: passar de 100% desativa Salvar plano', async () => {
    const { user, screen, store } = await openApp('#/sonhos/plano', async (s) => { await withThreeDreams(s); });
    const { japan } = { japan: await idOf(store, 'Viagem ao Japão') };
    await user.click(await screen.findByTestId(`button-plan-plus-${japan}`));
    expect(screen.getByTestId('text-plan-total')).toHaveTextContent('Total: 105%');
    expect(screen.getByTestId('button-save-plan')).toBeDisabled();
    await user.click(screen.getByTestId(`button-plan-minus-${japan}`));
    expect(screen.getByTestId('button-save-plan')).toBeEnabled();
  });

  // A parte salva pode não ser múltipla de 5 (38/37/25 depois de criar três sonhos); "+" e "−" vão ao múltiplo seguinte.
  it('"+" e "−" levam a parte ao múltiplo de 5: de 38/37/25 chega-se a 40/35/25', async () => {
    const { user, screen, store } = await openApp('#/sonhos/plano', async (s) => {
      await withRenda(s);
      await newDream(s, 'Viagem ao Japão', 18000, 100, 4320);
      await newDream(s, 'Reserva', 20000, 50, 6750, 'shield');
      await newDream(s, 'Notebook novo', 6000, 25, 5900, 'laptop');
    });
    const japan = await idOf(store, 'Viagem ao Japão');
    const reserve = await idOf(store, 'Reserva');
    expect(await screen.findByTestId(`text-plan-share-${japan}`)).toHaveTextContent('38%');
    await user.click(screen.getByTestId(`button-plan-plus-${japan}`));
    await user.click(screen.getByTestId(`button-plan-minus-${reserve}`));
    expect(screen.getByTestId(`text-plan-share-${japan}`)).toHaveTextContent('40%');
    expect(screen.getByTestId(`text-plan-share-${reserve}`)).toHaveTextContent('35%');
    expect(screen.getByTestId('text-plan-total')).toHaveTextContent('Total: 100%');
    expect(screen.getByTestId('button-save-plan')).toBeEnabled();
  });

  it('sobra do mês: fatura de R$ 417,16 com o plano em 20%', async () => {
    const { screen } = await openApp('#/sonhos/plano', async (s) => {
      await withThreeDreams(s);
      const card = (await s.saveCard({ name: 'Nubank' }, 'create')) as { id: number };
      await s.createMovement(card.id, null, { description: 'Compras', amount: 417.16, date: '2026-10-10' });
    });
    expect(plain((await screen.findByTestId('text-plan-leftover')).textContent)).toContain('sobram R$ 3.204,44 para o mês');
  });
});

describe('Caixinha', () => {
  it('ritmo e previsão: parte 40%, falta R$ 13.680 e plano 20%', async () => {
    const { screen } = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    expect(plain((await screen.findByTestId('text-dream-pace')).textContent)).toContain('R$ 362,16/mês');
    expect(screen.getByTestId('text-dream-eta')).toHaveTextContent('dez/2029');
    expect(plain(screen.getByTestId('text-dream-remaining').textContent)).toContain('R$ 13.680,00');
  });

  it('guardar agora: caixinha, saldo, linha do mês e resultado', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    const cash = await app.store.getMonthCash('2026-10');
    await deposit(app, '200');
    expect(await app.screen.findByTestId('screen-dream-saved')).toBeInTheDocument();
    expect(plain(app.screen.getByTestId('text-saved-amount').textContent)).toContain('+ R$ 200,00');
    expect(plain(app.screen.getByTestId('text-saved-total').textContent)).toBe('R$ 4.520,00');
    const after = await app.store.getMonthCash('2026-10');
    expect(after.balanceAmount).toBe(cash.balanceAmount - 200);
    expect(after.resultAmount).toBe(cash.resultAmount - 200);
    expect(after.savingsAmount).toBe(200);
    await app.user.click(app.screen.getByTestId('button-back-to-dream'));
    expect(plain((await app.screen.findByTestId('text-dream-saved')).textContent)).toBe('R$ 4.520,00');
    expect(app.screen.getByTestId('list-dream-entries')).toHaveTextContent('Aporte');
  });

  it('o atalho +100 soma ao valor e o aviso mostra o saldo depois', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withRenda(s); await newDream(s, 'Viagem ao Japão', 18000, 100, 4320); });
    await app.user.click(await app.screen.findByTestId('button-save-money'));
    await app.user.click(await app.screen.findByTestId('button-save-plus-100'));
    await app.user.click(app.screen.getByTestId('button-save-plus-50'));
    expect(app.screen.getByTestId('input-save-amount')).toHaveValue(150);
    expect(plain(app.screen.getByTestId('text-save-help').textContent)).toContain('Saldo depois: R$ 4.377,00');
    expect(plain(app.screen.getByTestId('button-save-confirm').textContent)).toBe('Guardar R$ 150,00');
  });

  it('guardar mais do que o saldo mostra o motivo e nada é salvo', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await deposit(app, '20000');
    expect(await app.screen.findByTestId('text-form-error')).toHaveTextContent(/saldo/i);
    expect((await app.store.getDreamEntries('2026-10')).items).toEqual([]);
  });

  it('marco de 25%: a tela "Guardado!" diz "Primeiro quarto da meta!"', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await deposit(app, '200');
    expect(await app.screen.findByTestId('text-milestone')).toHaveTextContent('Primeiro quarto da meta!');
  });

  it('retirar: a caixinha desce e o saldo sobe', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => {
      await withThreeDreams(s);
      const id = (await s.getDreams()).items[0].id;
      await s.depositDream(id, 200);
    });
    const before = await balance(app.store);
    await app.user.click(await app.screen.findByTestId('button-withdraw'));
    const input = await app.screen.findByTestId('input-save-amount');
    await app.user.type(input, '100');
    expect(plain(app.screen.getByTestId('text-save-help').textContent)).toContain('Volta para o saldo');
    await app.user.click(app.screen.getByTestId('button-save-confirm'));
    await app.waitFor(() => expect(plain(app.screen.getByTestId('text-dream-saved').textContent)).toBe('R$ 4.420,00'));
    expect(await balance(app.store)).toBe(before + 100);
  });

  it('retirar mais do que o guardado mostra o motivo e nada é salvo', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await app.user.click(await app.screen.findByTestId('button-withdraw'));
    await app.user.type(await app.screen.findByTestId('input-save-amount'), '99999');
    await app.user.click(app.screen.getByTestId('button-save-confirm'));
    expect(await app.screen.findByTestId('text-form-error')).toHaveTextContent(/guardados/i);
    expect((await app.store.getDream(app.id)).saved).toBe(4320);
  });

  it('"Tudo" preenche o valor guardado', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await app.user.click(await app.screen.findByTestId('button-withdraw'));
    await app.user.click(await app.screen.findByTestId('button-withdraw-all'));
    expect(app.screen.getByTestId('input-save-amount')).toHaveValue(4320);
  });

  it('editar o sonho muda o nome e a meta', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await app.user.click(await app.screen.findByTestId('menu-dream'));
    await app.user.click(await app.screen.findByTestId('button-edit-dream'));
    const name = await app.screen.findByTestId('input-dream-name');
    expect(name).toHaveValue('Viagem ao Japão');
    await app.user.clear(name);
    await app.user.type(name, 'Tóquio');
    await app.user.click(app.screen.getByTestId('button-save-dream'));
    expect(await app.screen.findByTestId('text-dream-name')).toHaveTextContent('Tóquio');
  });

  it('excluir um sonho: confirma, devolve o guardado ao saldo e preserva os aportes', async () => {
    const app = await openDream('Reserva', async (s) => {
      await withThreeDreams(s);
      const id = (await s.getDreams()).items.find((i) => i.name === 'Reserva')!.id;
      await s.depositDream(id, 250);
    });
    const before = await balance(app.store);
    await app.user.click(await app.screen.findByTestId('menu-dream'));
    await app.user.click(await app.screen.findByTestId('button-delete-dream'));
    expect(await app.screen.findByTestId('text-confirm')).toHaveTextContent(/R\$\s7\.000,00/);
    await app.user.click(app.screen.getByTestId('button-confirm-ok'));
    await app.screen.findByTestId('list-dreams');
    expect(app.screen.queryByText('Reserva')).not.toBeInTheDocument();
    expect(await balance(app.store)).toBe(before + 7000);
    expect((await app.store.getDreamEntries('2026-10')).items.some((i) => i.kind === 'deposit' && i.amount === 250)).toBe(true);
  });

  it('cancelar a exclusão mantém o sonho', async () => {
    const app = await openDream('Reserva', async (s) => { await withThreeDreams(s); });
    await app.user.click(await app.screen.findByTestId('menu-dream'));
    await app.user.click(await app.screen.findByTestId('button-delete-dream'));
    await app.user.click(await app.screen.findByTestId('button-confirm-cancel'));
    expect((await app.store.getDreams()).items).toHaveLength(3);
  });
});

describe('Conquista', () => {
  it('guardar até a meta abre "Você conquistou o Notebook novo!"', async () => {
    const app = await openDream('Notebook novo', async (s) => { await withThreeDreams(s); });
    await deposit(app, '100');
    expect(await app.screen.findByTestId('screen-dream-done')).toHaveTextContent('Você conquistou o Notebook novo!');
    expect(window.location.hash).toBe(`#/sonhos/${app.id}/conquista`);
  });

  it('manter guardado: vai para Conquistados com o dinheiro e o saldo não muda', async () => {
    const app = await openDream('Notebook novo', async (s) => {
      await withThreeDreams(s);
      await s.depositDream((await s.getDreams()).items.find((i) => i.name === 'Notebook novo')!.id, 100);
    }, '/conquista');
    const before = await balance(app.store);
    await app.user.click(await app.screen.findByTestId('button-keep-saved'));
    const done = await app.screen.findByTestId('list-dreams-done');
    expect(plain(done.textContent)).toContain('R$ 6.000,00 de R$ 6.000,00');
    expect(await balance(app.store)).toBe(before);
  });

  it('usar o dinheiro: o saldo não muda e nasce o gasto do dia a dia', async () => {
    const app = await openDream('Notebook novo', async (s) => {
      await withThreeDreams(s);
      await s.depositDream((await s.getDreams()).items.find((i) => i.name === 'Notebook novo')!.id, 100);
    }, '/conquista');
    const before = await balance(app.store);
    await app.user.click(await app.screen.findByTestId('button-use-money'));
    await app.screen.findByTestId('list-dreams');
    expect(await balance(app.store)).toBe(before);
    const { items } = await app.store.getDailyExpenses('2026-10');
    expect(items).toEqual([expect.objectContaining({ description: 'Notebook novo', amount: 6000, date: '2026-10-15' })]);
    // a parte dele passa aos outros sonhos
    expect((await app.store.getDreams()).items.filter((i) => i.status === 'active').reduce((sum, i) => sum + i.effectiveShare, 0)).toBeCloseTo(100, 5);
  });

  it('um sonho ainda ativo não tem tela de conquista', async () => {
    const app = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); }, '/conquista');
    await app.waitFor(() => expect(window.location.hash).toBe(`#/sonhos/${app.id}`));
  });
});

describe('Contas do mês e Início', () => {
  it('linha nas contas do mês: − R$ 200,00 e a lista abre o sonho', async () => {
    const { user, screen, waitFor, store } = await openApp('#/entradas', async (s) => {
      await withThreeDreams(s);
      await s.depositDream((await s.getDreams()).items[0].id, 200);
    });
    const row = await screen.findByTestId('row-origin-dreams');
    expect(plain(row.textContent)).toContain('Guardado em sonhos');
    expect(plain(row.textContent)).toContain('1 aporte');
    expect(plain(row.textContent)).toContain('− R$ 200,00');
    await user.click(row);
    await waitFor(() => expect(window.location.hash).toBe('#/entradas/lista/sonhos'));
    expect(plain((await screen.findByTestId('text-list-total')).textContent)).toContain('R$ 200,00');
    const [entry] = await screen.findAllByTestId(/^row-dream-entry-/);
    await user.click(entry);
    const id = (await store.getDreams()).items[0].id;
    await waitFor(() => expect(window.location.hash).toBe(`#/sonhos/${id}`));
  });

  it('o Resumo do mês também mostra a linha e o resultado desconta o guardado', async () => {
    const { screen } = await openApp('#/entradas/resumo', async (s) => {
      await withThreeDreams(s);
      await s.depositDream((await s.getDreams()).items[0].id, 200);
    });
    expect(plain((await screen.findByTestId('text-cash-dreams')).textContent)).toContain('− R$ 200,00');
    expect(plain(screen.getByTestId('text-cash-result').textContent)).toContain('R$ 4.327,00');
  });

  it('a lista do mês sem aportes mostra o estado vazio', async () => {
    const { screen } = await openApp('#/entradas/lista/sonhos', async (s) => { await withThreeDreams(s); });
    expect(await screen.findByTestId('text-dream-entries-empty')).toBeInTheDocument();
  });

  it('painel no Início: "Guardando R$ 905,40 por mês · 20% da renda" e uma barra por sonho', async () => {
    const { user, screen, waitFor } = await openApp('#/', async (s) => { await withThreeDreams(s); });
    expect(plain((await screen.findByTestId('text-home-dreams')).textContent)).toBe('Guardando R$ 905,40 por mês · 20% da renda');
    expect(screen.getAllByTestId(/^row-home-dream-/)).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Abrir Sonhos' }));
    await waitFor(() => expect(window.location.hash).toBe('#/sonhos'));
  });

  it('painel no Início: com mais de 3 sonhos mostra "e mais N"', async () => {
    const { screen } = await openApp('#/', async (s) => {
      await withRenda(s);
      for (const n of [1, 2, 3, 4, 5]) await newDream(s, `Sonho ${n}`, 1000, 10);
    });
    expect(await screen.findByText('e mais 2')).toBeInTheDocument();
  });

  it('painel no Início: sem sonhos convida a criar o primeiro', async () => {
    const { screen } = await openApp('#/', withCash);
    expect(await screen.findByTestId('text-home-dreams-empty')).toBeInTheDocument();
  });
});

describe('Animações, olho e falhas', () => {
  const breakDreams = (s: Store) => {
    const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? '').includes('"version"'))!;
    const state = JSON.parse(localStorage.getItem(key)!);
    state.dreams = 'quebrado';
    localStorage.setItem(key, JSON.stringify(state));
    // O app que abre em seguida importa o store de novo e lê o estado quebrado.
    vi.resetModules();
    return s;
  };

  it('com movimento reduzido a caixinha aparece já no estado final', async () => {
    const { screen, container } = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    expect(plain((await screen.findByTestId('text-dream-saved')).textContent)).toBe('R$ 4.320,00');
    expect(container.querySelector('.dream-jar-level')).toBeNull();
  });

  it('sem a preferência de movimento reduzido a caixinha anima na primeira exibição', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: false })) as typeof window.matchMedia;
    try {
      const { screen, container } = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
      await screen.findByTestId('text-dream-saved');
      expect(container.querySelector('.dream-jar-level')).not.toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });

  it('olho fechado: valores e percentuais mascarados, anel e caixinha neutros', async () => {
    // O olho fica no cabeçalho das áreas; as telas de Sonhos só leem o estado dele.
    const { user, screen, container } = await openApp('#/', async (s) => { await withThreeDreams(s); });
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = '#/sonhos';
    const [row] = await screen.findAllByTestId(/^row-dream-/);
    expect(row).toHaveTextContent('R$ ••••');
    expect(row).toHaveTextContent('••%');
    expect(row).not.toHaveTextContent('4.320');
    expect(container.querySelector('.dream-ring-arc')).toBeNull();
    expect(screen.getAllByRole('img', { name: 'Progresso escondido' }).length).toBeGreaterThan(0);
    expect(container.querySelector('[data-hidden-chart]')).not.toBeNull();
  });

  it('olho fechado na caixinha: sem nível no frasco e valores mascarados', async () => {
    const { user, screen, id } = await openDream('Viagem ao Japão', async (s) => { await withThreeDreams(s); });
    await screen.findByTestId('text-dream-saved');
    window.location.hash = '#/';
    await user.click(await screen.findByTestId('button-hide-values'));
    window.location.hash = `#/sonhos/${id}`;
    expect(await screen.findByRole('img', { name: 'Caixinha escondida' })).toBeInTheDocument();
    expect(screen.getByTestId('text-dream-saved')).toHaveTextContent('R$ ••••');
  });

  it('falha ao ler os sonhos: erro com "Tentar de novo" e o Início segue normal', async () => {
    const { user, screen } = await openApp('#/sonhos', async (s) => { await withThreeDreams(s); breakDreams(s); });
    expect(await screen.findByTestId('text-dreams-error')).toHaveTextContent('Tentar de novo');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByTestId('text-dreams-error')).toBeInTheDocument();
    window.location.hash = '#/';
    expect(await screen.findByTestId('text-home-dreams-error')).toHaveTextContent('Sonhos indisponível');
    expect(plain(screen.getByTestId('text-home-balance').textContent)).toContain('R$');
    expect(screen.getByTestId('card-home-invoice')).toBeInTheDocument();
  });
});

