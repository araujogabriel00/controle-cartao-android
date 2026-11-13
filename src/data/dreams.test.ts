import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cenários de dados de specs/sonhos.md. Hoje é 15/10/2026; a renda do mês é R$ 4.527,00.
type Store = typeof import('@/data/store');
let s: Store;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  s = await import('@/data/store');
});

const withIncome = () => s.createIncome({ kind: 'salario', amount: 4527, date: '2026-10-05', recurring: true });
const dream = async (name: string, goal: number, share: number, initial = 0, icon: 'plane' | 'shield' | 'laptop' = 'plane') =>
  (await s.createDream({ name, goal, initial, icon, share })) as { id: number };
const balance = async () => (await s.getMonthCash('2026-10')).balanceAmount;
const find = async (id: number) => (await s.getDreams()).items.find((i) => i.id === id)!;

describe('criar e validar', () => {
  it('o guardado inicial não mexe no saldo', async () => {
    await withIncome();
    const before = await balance();
    const japan = await dream('Viagem ao Japão', 18000, 100, 4320);
    const item = await find(japan.id);
    expect(item).toMatchObject({ saved: 4320, goal: 18000, status: 'active' });
    expect(Math.round(item.percent)).toBe(24);
    expect(await balance()).toBe(before);
    expect((await s.getMonthCash('2026-10')).savingsAmount).toBe(0);
  });

  it.each([
    ['guardado igual à meta', { name: 'X', goal: 100, initial: 100, icon: 'star' as const, share: 100 }],
    ['nome vazio', { name: ' ', goal: 100, initial: 0, icon: 'star' as const, share: 100 }],
    ['meta zero', { name: 'X', goal: 0, initial: 0, icon: 'star' as const, share: 100 }],
    ['guardado negativo', { name: 'X', goal: 100, initial: -1, icon: 'star' as const, share: 100 }],
    ['parte zero', { name: 'X', goal: 100, initial: 0, icon: 'star' as const, share: 0 }],
    ['ícone fora da lista', { name: 'X', goal: 100, initial: 0, icon: 'cat' as never, share: 100 }],
  ])('recusa %s e nada é salvo', async (_label, input) => {
    await expect(s.createDream(input)).rejects.toThrow();
    expect((await s.getDreams()).items).toEqual([]);
  });

  it('o nome tem no máximo 60 caracteres', async () => {
    await expect(s.createDream({ name: 'a'.repeat(61), goal: 100, icon: 'star', share: 100 })).rejects.toThrow(/60/);
  });

  it('aceita até 12 sonhos ativos', async () => {
    for (let i = 0; i < 12; i++) await dream(`S${i}`, 100, 8);
    await expect(s.createDream({ name: 'S12', goal: 100, icon: 'star', share: 1 })).rejects.toThrow(/12/);
  });
});

describe('plano', () => {
  const three = async () => {
    const japan = await dream('Japão', 18000, 100, 4320);
    const reserve = await dream('Reserva', 20000, 50, 6750, 'shield');
    const notebook = await dream('Notebook', 6000, 25, 0, 'laptop');
    return { japan, reserve, notebook };
  };

  it('criar um sonho reduz os outros para a soma voltar a 100', async () => {
    const { notebook } = await three();
    const { items } = await s.getDreamPlan();
    expect(items.map((i) => i.share).reduce((a, b) => a + b, 0)).toBe(100);
    expect(items.find((i) => i.id === notebook.id)!.share).toBe(25);
    expect(items.every((i) => i.share >= 1)).toBe(true);
  });

  it('com um só sonho ativo a parte é 100', async () => {
    const only = await dream('Japão', 18000, 30);
    expect((await find(only.id)).share).toBe(100);
  });

  it('20% da renda dá R$ 905,40 por mês e salva com 100%', async () => {
    await withIncome();
    const { japan, reserve, notebook } = await three();
    await s.saveDreamPlan({ percent: 20, shares: [{ dreamId: japan.id, share: 40 }, { dreamId: reserve.id, share: 35 }, { dreamId: notebook.id, share: 25 }] });
    const plan = await s.getDreamPlan();
    expect(plan).toMatchObject({ percent: 20, hasPlan: true, referenceIncome: 4527, monthlyAmount: 905.4 });
    expect(plan.items.map((i) => i.share)).toEqual([40, 35, 25]);
  });

  it('divisão que não fecha 100 é recusada', async () => {
    const { japan, reserve, notebook } = await three();
    await expect(s.saveDreamPlan({ percent: 20, shares: [{ dreamId: japan.id, share: 50 }, { dreamId: reserve.id, share: 35 }, { dreamId: notebook.id, share: 25 }] })).rejects.toThrow(/100/);
    expect((await s.getDreamPlan()).hasPlan).toBe(false);
  });

  it('percentual acima de 50 ou fracionado é recusado', async () => {
    const only = await dream('Japão', 18000, 100);
    await expect(s.saveDreamPlan({ percent: 51, shares: [{ dreamId: only.id, share: 100 }] })).rejects.toThrow();
    await expect(s.saveDreamPlan({ percent: 12.5, shares: [{ dreamId: only.id, share: 100 }] })).rejects.toThrow();
  });

  it('a sobra do mês desconta o guardado planejado e a fatura', async () => {
    await withIncome();
    const card = (await s.saveCard({ name: 'Nubank' }, 'create')) as { id: number };
    await s.createMovement(card.id, null, { description: 'Mercado', amount: 417.16, date: '2026-10-10' });
    const only = await dream('Japão', 18000, 100);
    await s.saveDreamPlan({ percent: 20, shares: [{ dreamId: only.id, share: 100 }] });
    expect((await s.getDreamPlan()).leftoverAmount).toBe(3204.44);
  });

  it('sem renda no mês usa a do mês anterior', async () => {
    await s.createIncome({ kind: 'salario', amount: 1000, date: '2026-09-05', recurring: false });
    expect((await s.getDreamPlan()).referenceIncome).toBe(1000);
  });
});

describe('ritmo e previsão', () => {
  it('parte 40%, falta R$ 13.680 e plano 20% dá R$ 362,16 por mês até dez/2029', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 4320);
    const reserve = await dream('Reserva', 20000, 60, 0, 'shield');
    await s.saveDreamPlan({ percent: 20, shares: [{ dreamId: japan.id, share: 40 }, { dreamId: reserve.id, share: 60 }] });
    expect(await find(japan.id)).toMatchObject({ remaining: 13680, pace: 362.16, etaMonth: '2029-12' });
  });

  it('sem plano, sem renda ou sem parte a previsão é vazia', async () => {
    const japan = await dream('Japão', 18000, 100);
    expect(await find(japan.id)).toMatchObject({ pace: null, etaMonth: null });
    await withIncome();
    expect(await find(japan.id)).toMatchObject({ pace: null, etaMonth: null });
  });

  it('80% ou mais leva "quase lá"', async () => {
    const near = await dream('Quase', 1000, 100, 800);
    expect((await find(near.id)).almostThere).toBe(true);
    const far = await dream('Longe', 1000, 10, 100);
    expect((await find(far.id)).almostThere).toBe(false);
  });

  it('a parte de um sonho conquistado passa aos outros na proporção', async () => {
    await withIncome();
    const a = await dream('A', 1000, 100);
    const b = await dream('B', 1000, 50);
    const c = await dream('C', 1000, 25);
    await s.saveDreamPlan({ percent: 20, shares: [{ dreamId: a.id, share: 40 }, { dreamId: b.id, share: 35 }, { dreamId: c.id, share: 25 }] });
    await s.depositDream(c.id, 1000);
    expect((await find(a.id)).effectiveShare).toBeCloseTo((40 / 75) * 100, 5);
    expect((await find(b.id)).effectiveShare).toBeCloseTo((35 / 75) * 100, 5);
    expect((await find(a.id)).share).toBe(40);
  });
});

describe('guardar e retirar', () => {
  it('guardar tira do saldo, sobe a caixinha e entra na linha do mês', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 4320);
    const cashBefore = await s.getMonthCash('2026-10');
    await s.depositDream(japan.id, 200);
    expect((await find(japan.id)).saved).toBe(4520);
    const cash = await s.getMonthCash('2026-10');
    expect(cash.balanceAmount).toBe(cashBefore.balanceAmount - 200);
    expect(cash.resultAmount).toBe(cashBefore.resultAmount - 200);
    expect(cash.savingsAmount).toBe(200);
    expect(await s.getDreamEntries('2026-10')).toMatchObject({ savingsAmount: 200, depositCount: 1, withdrawCount: 0 });
  });

  it('o aporte conta no mês da data de hoje, não nos outros', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100);
    await s.depositDream(japan.id, 200);
    expect((await s.getMonthCash('2026-09')).savingsAmount).toBe(0);
    expect((await s.getMonthCash('2026-11')).savingsAmount).toBe(0);
  });

  it('guardar mais do que o saldo é recusado e nada muda', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 100);
    await expect(s.depositDream(japan.id, 20000)).rejects.toThrow(/saldo/i);
    expect((await find(japan.id)).saved).toBe(100);
    expect((await s.getDreamEntries('2026-10')).items).toEqual([]);
  });

  it.each([0, -5, Number.NaN])('valor %s é recusado', async (value) => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100);
    await expect(s.depositDream(japan.id, value)).rejects.toThrow();
  });

  it('o aporte que cruza 25% mostra o marco', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 4320);
    const result = await s.depositDream(japan.id, 200);
    expect(result).toMatchObject({ milestone: 25, reached: false });
  });

  it('cruzar mais de um marco mostra o maior', async () => {
    await s.createIncome({ kind: 'salario', amount: 9000, date: '2026-10-05', recurring: false });
    const japan = await dream('Japão', 10000, 100, 1000);
    expect(await s.depositDream(japan.id, 7000)).toMatchObject({ milestone: 75 });
  });

  it('sem cruzar marco não há mensagem', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 100);
    expect(await s.depositDream(japan.id, 50)).toMatchObject({ milestone: null });
  });

  it('retirar devolve ao saldo', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 4520);
    const before = await balance();
    await s.withdrawDream(japan.id, 100);
    expect((await find(japan.id)).saved).toBe(4420);
    expect(await balance()).toBe(before + 100);
    expect((await s.getMonthCash('2026-10')).savingsAmount).toBe(-100);
  });

  it('retirar mais do que o guardado é recusado', async () => {
    const japan = await dream('Japão', 18000, 100, 4520);
    await expect(s.withdrawDream(japan.id, 99999)).rejects.toThrow(/guardados/i);
    expect((await find(japan.id)).saved).toBe(4520);
  });
});

describe('conquista', () => {
  const notebook = async () => {
    await withIncome();
    const item = await dream('Notebook novo', 6000, 100, 5900, 'laptop');
    return item;
  };

  it('guardar até a meta conquista o sonho', async () => {
    const book = await notebook();
    expect(await s.depositDream(book.id, 100)).toMatchObject({ reached: true, saved: 6000 });
    expect((await find(book.id)).status).toBe('reached');
  });

  it('o aporte pode passar da meta', async () => {
    const book = await notebook();
    await s.depositDream(book.id, 150);
    expect((await find(book.id)).saved).toBe(6050);
  });

  it('ainda não conquistado não pode ser encerrado', async () => {
    const book = await notebook();
    await expect(s.closeDream(book.id, 'keep')).rejects.toThrow();
  });

  it('manter guardado encerra e o saldo não muda', async () => {
    const book = await notebook();
    await s.depositDream(book.id, 100);
    const before = await balance();
    await s.closeDream(book.id, 'keep');
    expect(await find(book.id)).toMatchObject({ status: 'closed', saved: 6000 });
    expect(await balance()).toBe(before);
    expect((await s.getDailyExpenses('2026-10')).items).toEqual([]);
  });

  it('usar o dinheiro mantém o saldo e registra o gasto do dia a dia', async () => {
    const book = await notebook();
    await s.depositDream(book.id, 100);
    const before = await balance();
    await s.closeDream(book.id, 'use');
    expect(await balance()).toBe(before);
    const { items } = await s.getDailyExpenses('2026-10');
    expect(items).toEqual([expect.objectContaining({ description: 'Notebook novo', amount: 6000, date: '2026-10-15', categoryId: null })]);
    expect((await find(book.id)).status).toBe('closed');
  });

  it('usar o dinheiro passa a parte aos outros sonhos', async () => {
    const book = await notebook();
    const trip = await dream('Viagem', 9000, 50);
    await s.depositDream(book.id, 100);
    await s.closeDream(book.id, 'use');
    expect((await find(trip.id)).effectiveShare).toBe(100);
  });

  it('sonho encerrado não recebe aporte nem retirada', async () => {
    const book = await notebook();
    await s.depositDream(book.id, 100);
    await s.closeDream(book.id, 'keep');
    await expect(s.depositDream(book.id, 10)).rejects.toThrow(/encerrada/i);
    await expect(s.withdrawDream(book.id, 10)).rejects.toThrow(/encerrada/i);
    await expect(s.closeDream(book.id, 'use')).rejects.toThrow();
    await expect(s.depositDream(9999, 10)).rejects.toThrow('Caixinha não encontrada.');
  });

  it('retirar de um conquistado o devolve a ativo', async () => {
    const book = await notebook();
    await s.depositDream(book.id, 100);
    await s.withdrawDream(book.id, 500);
    expect((await find(book.id)).status).toBe('active');
  });
});

describe('editar e excluir', () => {
  it('edita nome, ícone e meta', async () => {
    const japan = await dream('Japão', 18000, 100, 100);
    await s.updateDream(japan.id, { name: 'Tóquio', icon: 'star', goal: 20000, share: 100 });
    expect(await find(japan.id)).toMatchObject({ name: 'Tóquio', icon: 'star', goal: 20000 });
  });

  it('a meta não pode ficar abaixo do que já está guardado', async () => {
    const japan = await dream('Japão', 18000, 100, 5000);
    await expect(s.updateDream(japan.id, { name: 'Japão', icon: 'plane', goal: 5000, share: 100 })).rejects.toThrow(/meta/i);
  });

  it('mudar a parte reajusta os outros sonhos para 100', async () => {
    const a = await dream('A', 1000, 100);
    const b = await dream('B', 1000, 50);
    await s.updateDream(a.id, { name: 'A', icon: 'plane', goal: 1000, share: 80 });
    const { items } = await s.getDreamPlan();
    expect(items.find((i) => i.id === a.id)!.share).toBe(80);
    expect(items.find((i) => i.id === b.id)!.share).toBe(20);
  });

  it('excluir devolve o guardado ao saldo e preserva os aportes dos meses', async () => {
    await withIncome();
    const reserve = await dream('Reserva', 20000, 100, 6750, 'shield');
    await s.depositDream(reserve.id, 250);
    const before = await balance();
    await s.deleteDream(reserve.id);
    expect(await balance()).toBe(before + 7000);
    expect((await s.getDreams()).items).toEqual([]);
    const entries = await s.getDreamEntries('2026-10');
    expect(entries.items.map((i) => [i.kind, i.amount, i.dreamArchived])).toEqual([['withdraw', 7000, true], ['deposit', 250, true]]);
    await expect(s.getDream(reserve.id)).rejects.toThrow();
    await expect(s.depositDream(reserve.id, 10)).rejects.toThrow();
  });

  it('excluir sem guardado só arquiva', async () => {
    const empty = await dream('Vazio', 100, 100);
    await s.deleteDream(empty.id);
    expect((await s.getDreams()).items).toEqual([]);
    expect((await s.getDreamEntries('2026-10')).items).toEqual([]);
  });

  it('o sonho que sai do plano passa a parte aos outros', async () => {
    const a = await dream('A', 1000, 100);
    const b = await dream('B', 1000, 50);
    await s.deleteDream(a.id);
    expect((await find(b.id)).effectiveShare).toBe(100);
  });
});

describe('linha do caixa e leituras', () => {
  it('o resultado do mês desconta os aportes e as retiradas', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100, 1000);
    await s.depositDream(japan.id, 300);
    await s.withdrawDream(japan.id, 100);
    const cash = await s.getMonthCash('2026-10');
    expect(cash.savingsAmount).toBe(200);
    expect(cash.resultAmount).toBe(4527 - 200);
  });

  it('o saldo mês a mês acompanha o caixa e os aportes não viram lançamento recente', async () => {
    await withIncome();
    const japan = await dream('Japão', 18000, 100);
    await s.depositDream(japan.id, 300);
    const series = await s.getBalanceSeries('2026-10', 1);
    expect(series.at(-1)?.balanceAmount).toBe(4227);
    expect((await s.getRecentSpends('2026-10', 10)).map((r) => r.description)).not.toContain('Japão');
  });

  it('sem sonhos a linha é zero e nada muda', async () => {
    await withIncome();
    expect(await s.getMonthCash('2026-10')).toMatchObject({ savingsAmount: 0, resultAmount: 4527 });
  });

  it('sonhos conquistados e encerrados vão para o fim da lista', async () => {
    await withIncome();
    const done = await dream('Pronto', 100, 100, 99);
    const open = await dream('Aberto', 1000, 50);
    await s.depositDream(done.id, 1);
    expect((await s.getDreams()).items.map((i) => i.id)).toEqual([open.id, done.id]);
    expect((await s.getDreams()).activeCount).toBe(1);
  });
});

describe('migração v11 → v13', () => {
  it('abre os dados da v11 sem perda e salva na v13', async () => {
    await s.saveCard({ name: 'Inter' }, 'create');
    const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? '').includes('"version"'))!;
    const old = JSON.parse(localStorage.getItem(key)!);
    old.version = 11;
    delete old.dreams;
    delete old.dreamEntries;
    delete old.dreamPlan;
    localStorage.setItem(key, JSON.stringify(old));
    vi.resetModules();
    s = await import('@/data/store');
    expect((await s.getCards('2026-10')).cards.map((c) => c.name)).toEqual(['Inter']);
    expect((await s.getDreams()).items).toEqual([]);
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ version: 13, dreams: [], dreamEntries: [], dreamPlan: null, cartItems: [] }));
  });
});

// specs/caixinhas-quando-guardar.md: hoje é 15/10/2026; renda de R$ 6.000,00, plano de 10% (R$ 600,00) e reserva de R$ 1.500,00.
describe('quando guardar', () => {
  // `balanceToday` define o saldo de hoje com uma conta fixa que desconta a diferença da renda.
  const setup = async (balanceToday = 3280, reserve: number | undefined = 1500) => {
    await s.createIncome({ kind: 'salario', amount: 6000, date: '2026-10-05', recurring: true });
    if (balanceToday < 6000) await s.createBill({ name: 'Aluguel', amount: 6000 - balanceToday, date: '2026-10-08' });
    const trip = await dream('Viagem', 10000, 100);
    await s.saveDreamPlan({ percent: 10, reserve, shares: [{ dreamId: trip.id, share: 100 }] });
    return trip;
  };
  const forecast = (kind: 'pay' | 'receive', amount: number, date: string, affects = true) =>
    s.createForecast({ kind, description: 'Previsão', amount, date, affects, recurring: false });

  it('cabe a partir de uma data: 25/10 e hoje cabem R$ 430,00', async () => {
    await setup();
    await forecast('pay', 1350, '2026-10-17');
    await forecast('receive', 2000, '2026-10-25');
    await forecast('pay', 700, '2026-10-30');
    const w = await s.getDreamSavingWindow();
    expect(w).toMatchObject({ hasPlan: true, reserve: 1500, amount: 600, todayRoom: 430, state: 'later', releaseDate: '2026-10-25' });
    expect(w.days).toHaveLength(31);
    expect(w.days[0].date).toBe('2026-10-15');
    expect(w.days.filter((d) => !d.ok).map((d) => d.date.slice(8))).toEqual(['15', '16', '17', '18', '19', '20', '21', '22', '23', '24']);
    expect(w.days.slice(10).every((d) => d.ok)).toBe(true);
  });

  it('pode guardar agora quando o saldo cobre o valor e a reserva em toda a janela', async () => {
    await setup(4000);
    const w = await s.getDreamSavingWindow();
    expect(w).toMatchObject({ state: 'now', releaseDate: '2026-10-15', todayRoom: 2500 });
    expect(w.days.every((d) => d.ok)).toBe(true);
  });

  it('ainda não nos próximos 30 dias: hoje cabem R$ 100,00', async () => {
    await setup(1600);
    const w = await s.getDreamSavingWindow();
    expect(w).toMatchObject({ state: 'never', releaseDate: null, todayRoom: 100 });
    expect(w.days.every((d) => !d.ok)).toBe(true);
  });

  it('saldo já abaixo da reserva: nada cabe hoje', async () => {
    await setup(1000);
    expect(await s.getDreamSavingWindow()).toMatchObject({ state: 'never', todayRoom: 0 });
  });

  it('meta do mês cumprida: sem faixa; só falta uma parte: guarda o que falta', async () => {
    const trip = await setup(4000);
    await s.depositDream(trip.id, 250);
    expect(await s.getDreamSavingWindow()).toMatchObject({ state: 'now', amount: 350 });
    await s.depositDream(trip.id, 350);
    expect(await s.getDreamSavingWindow()).toMatchObject({ state: 'done', amount: 0, days: [] });
  });

  it('lembrete que não mexe no saldo não muda a resposta', async () => {
    await setup(4000);
    const before = await s.getDreamSavingWindow();
    await forecast('pay', 2000, '2026-10-20', false);
    expect(await s.getDreamSavingWindow()).toEqual(before);
  });

  it('sem plano salvo não há janela', async () => {
    await s.createIncome({ kind: 'salario', amount: 6000, date: '2026-10-05', recurring: true });
    expect(await s.getDreamSavingWindow()).toMatchObject({ hasPlan: false, state: 'done', days: [] });
  });

  it('guardar além da folga continua permitido (D7)', async () => {
    const trip = await setup();
    await forecast('pay', 1350, '2026-10-17');
    await expect(s.depositDream(trip.id, 600)).resolves.toBeDefined();
  });

  it('a reserva é validada e, sem informar, mantém a salva', async () => {
    const trip = await setup(3280, 2000);
    const shares = [{ dreamId: trip.id, share: 100 }];
    await expect(s.saveDreamPlan({ percent: 10, reserve: -1, shares })).rejects.toThrow('A reserva deve ser um valor de 0 a 999.999,99.');
    await expect(s.saveDreamPlan({ percent: 10, reserve: 1000000, shares })).rejects.toThrow(/reserva/);
    await s.saveDreamPlan({ percent: 15, shares });
    expect((await s.getDreamPlan()).reserve).toBe(2000);
  });

  it('backup sem reserve abre com reserva 0, sem subir a versão', async () => {
    await setup();
    const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? '').includes('"version"'))!;
    const old = JSON.parse(localStorage.getItem(key)!);
    delete old.dreamPlan.reserve;
    localStorage.setItem(key, JSON.stringify(old));
    vi.resetModules();
    s = await import('@/data/store');
    expect((await s.getDreamPlan()).reserve).toBe(0);
    expect(JSON.parse(localStorage.getItem(key)!).version).toBe(13);
  });
});
