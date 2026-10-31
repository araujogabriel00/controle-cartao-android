// Distribuição do carrinho entre as formas de pagamento (specs/carrinho.md D6 a D9, RN-06, RN-07).
// Funções puras, em centavos inteiros: o store as usa para validar e fechar o carrinho, e as telas, para o que vai mudar.

export type CartLine = { id: number; categoryId: number | null; total: number };

// O que um benefício pode pagar agora (RN-04): sem divisão, qualquer produto até o disponível total; com divisão, só as
// categorias da divisão que estão abertas, cada uma até o disponível dela.
export type BenefitCap = { id: number; divided: boolean; available: number; byCategory: Record<number, number> };

export type CartForm =
  | { kind: 'benefit'; id: number; amount: number }
  | { kind: 'card'; id: number; amount: number; installments: number }
  | { kind: 'balance'; amount: number };

export type CartPiece = { lineId: number; formIndex: number; amount: number };

export type CartIssue = { code: 'sum' | 'amount' | 'duplicate' | 'installments' | 'limit' | 'fill' | 'missing'; formIndex: number | null; limit?: number };

export const INSTALLMENT_OPTIONS = [1, 2, 3, 6, 12] as const;

export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (value: number) => value / 100;

export const formKey = (form: CartForm) => (form.kind === 'balance' ? 'balance' : `${form.kind}:${form.id}`);

const totalOf = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.total, 0);

// D6: para cada categoria do carrinho, o menor entre o total dela e o disponível dela no benefício.
export function coverageOf(cap: BenefitCap, lines: CartLine[]) {
  if (!cap.divided) return Math.min(totalOf(lines), Math.max(0, cap.available));
  const byCategory = new Map<number, number>();
  for (const line of lines) if (line.categoryId !== null) byCategory.set(line.categoryId, (byCategory.get(line.categoryId) ?? 0) + line.total);
  let covered = 0;
  for (const [categoryId, total] of byCategory) covered += Math.min(total, Math.max(0, cap.byCategory[categoryId] ?? 0));
  return covered;
}

// RN-07: primeiro os benefícios (na ordem dada, só produtos que cada um cobre), depois os cartões e por fim o saldo.
// Os produtos entram na ordem do carrinho e um produto pode ser quebrado quando o valor da forma acaba no meio dele.
export function distribute(lines: CartLine[], forms: CartForm[], caps: BenefitCap[]) {
  const left = new Map(lines.map((line) => [line.id, line.total]));
  const pools = new Map(caps.map((cap) => [cap.id, { divided: cap.divided, rest: Math.max(0, cap.available), byCategory: { ...cap.byCategory } }]));
  const rank = (form: CartForm) => (form.kind === 'benefit' ? 0 : form.kind === 'card' ? 1 : 2);
  const order = forms.map((_, index) => index).sort((a, b) => rank(forms[a]) - rank(forms[b]) || a - b);
  const pieces: CartPiece[] = [];
  const short: number[] = forms.map(() => 0);

  for (const index of order) {
    const form = forms[index];
    const pool = form.kind === 'benefit' ? pools.get(form.id) : undefined;
    let need = form.amount;
    for (const line of lines) {
      if (need <= 0) break;
      const free = left.get(line.id) ?? 0;
      if (free <= 0) continue;
      let room = Infinity;
      if (form.kind === 'benefit') {
        if (!pool) room = 0;
        else if (pool.divided) room = line.categoryId === null ? 0 : pool.byCategory[line.categoryId] ?? 0;
        else room = pool.rest;
      }
      const take = Math.min(free, need, room);
      if (take <= 0) continue;
      pieces.push({ lineId: line.id, formIndex: index, amount: take });
      left.set(line.id, free - take);
      need -= take;
      if (pool) {
        if (pool.divided) pool.byCategory[line.categoryId as number] -= take;
        else pool.rest -= take;
      }
    }
    short[index] = need;
  }
  return { pieces, short, leftover: [...left.values()].reduce((sum, value) => sum + value, 0) };
}

// RN-06: a soma fecha o total, cada valor é maior que zero, o benefício não passa da cobertura e cada forma vem uma vez.
export function validateForms(lines: CartLine[], forms: CartForm[], caps: BenefitCap[], exists: (form: CartForm) => boolean = () => true) {
  const issues: CartIssue[] = [];
  const total = totalOf(lines);
  const seen = new Set<string>();
  forms.forEach((form, index) => {
    if (!Number.isInteger(form.amount) || form.amount <= 0) issues.push({ code: 'amount', formIndex: index });
    const key = formKey(form);
    if (seen.has(key)) issues.push({ code: 'duplicate', formIndex: index });
    seen.add(key);
    if (!exists(form)) issues.push({ code: 'missing', formIndex: index });
    if (form.kind === 'card' && !(INSTALLMENT_OPTIONS as readonly number[]).includes(form.installments)) issues.push({ code: 'installments', formIndex: index });
    if (form.kind === 'benefit') {
      const cap = caps.find((c) => c.id === form.id);
      const limit = cap ? coverageOf(cap, lines) : 0;
      if (form.amount > limit) issues.push({ code: 'limit', formIndex: index, limit });
    }
  });
  const left = total - forms.reduce((sum, form) => sum + (Number.isFinite(form.amount) ? form.amount : 0), 0);
  if (left !== 0) issues.push({ code: 'sum', formIndex: null, limit: left });
  if (!issues.length) {
    const { short } = distribute(lines, forms, caps);
    short.forEach((value, index) => { if (value > 0) issues.push({ code: 'fill', formIndex: index }); });
  }
  return { issues, left, total };
}

// D9: cada benefício no máximo do que cobre (na ordem) e o resto no primeiro cartão, ou no saldo se não há cartão.
export function suggestForms(lines: CartLine[], caps: BenefitCap[], firstCardId: number | null): CartForm[] {
  const forms: CartForm[] = [];
  let rest = lines.map((line) => ({ ...line }));
  for (const cap of caps) {
    const free = totalOf(rest);
    if (free <= 0) break;
    const { pieces } = distribute(rest, [{ kind: 'benefit', id: cap.id, amount: free }], [cap]);
    const covered = pieces.reduce((sum, piece) => sum + piece.amount, 0);
    if (covered <= 0) continue;
    forms.push({ kind: 'benefit', id: cap.id, amount: covered });
    rest = rest.map((line) => ({ ...line, total: line.total - pieces.filter((p) => p.lineId === line.id).reduce((sum, p) => sum + p.amount, 0) }));
  }
  const remaining = totalOf(rest);
  if (remaining > 0) forms.push(firstCardId !== null ? { kind: 'card', id: firstCardId, amount: remaining, installments: 1 } : { kind: 'balance', amount: remaining });
  return forms;
}
