import { describe, expect, it } from 'vitest';
import { type BenefitCap, type CartForm, type CartLine, coverageOf, distribute, suggestForms, validateForms } from '@/lib/cart-checkout';

// Carrinho dos cenários de specs/carrinho.md, em centavos: Fone R$ 120,00 (categoria 2), Arroz 5 kg R$ 65,80 e Café R$ 18,50 (categoria 1).
const FONE: CartLine = { id: 1, categoryId: 2, total: 12000 };
const ARROZ: CartLine = { id: 2, categoryId: 1, total: 6580 };
const CAFE: CartLine = { id: 3, categoryId: 1, total: 1850 };
const lines = [FONE, ARROZ, CAFE];
// Vale-refeição dividido só em Alimentação, com R$ 480,00 disponíveis.
const VR: BenefitCap = { id: 10, divided: true, available: 48000, byCategory: { 1: 48000 } };

const piecesOf = (result: ReturnType<typeof distribute>) => result.pieces.map((p) => [p.lineId, p.formIndex, p.amount]);

describe('cobertura do benefício (D6)', () => {
  it('cobre só as categorias da divisão', () => {
    expect(coverageOf(VR, lines)).toBe(8430);
  });

  it('limita pelo disponível da categoria', () => {
    expect(coverageOf({ ...VR, byCategory: { 1: 5000 } }, lines)).toBe(5000);
  });

  it('categoria fora da divisão ou fechada não é coberta', () => {
    expect(coverageOf({ ...VR, byCategory: {} }, lines)).toBe(0);
    expect(coverageOf({ ...VR, byCategory: { 3: 1000 } }, lines)).toBe(0);
  });

  it('produto sem categoria não é coberto por benefício dividido', () => {
    expect(coverageOf(VR, [{ id: 9, categoryId: null, total: 1000 }])).toBe(0);
  });

  it('benefício sem divisão cobre qualquer categoria até o disponível total', () => {
    const open: BenefitCap = { id: 11, divided: false, available: 5000, byCategory: {} };
    expect(coverageOf(open, lines)).toBe(5000);
    expect(coverageOf({ ...open, available: 99999 }, [...lines, { id: 9, categoryId: null, total: 1000 }])).toBe(21430);
  });
});

describe('distribuição (RN-07)', () => {
  it('benefício paga só o que cobre e o cartão fica com o resto', () => {
    const forms: CartForm[] = [{ kind: 'card', id: 5, amount: 12000, installments: 3 }, { kind: 'benefit', id: 10, amount: 8430 }];
    const result = distribute(lines, forms, [VR]);
    // O benefício é processado antes do cartão, mesmo vindo depois na lista.
    expect(piecesOf(result)).toEqual([[2, 1, 6580], [3, 1, 1850], [1, 0, 12000]]);
    expect(result.short).toEqual([0, 0]);
    expect(result.leftover).toBe(0);
  });

  it('um produto é quebrado quando o valor da forma acaba no meio dele', () => {
    const forms: CartForm[] = [{ kind: 'benefit', id: 10, amount: 5000 }, { kind: 'balance', amount: 15430 }];
    const result = distribute(lines, forms, [VR]);
    expect(piecesOf(result)).toEqual([[2, 0, 5000], [1, 1, 12000], [2, 1, 1580], [3, 1, 1850]]);
    expect(result.leftover).toBe(0);
  });

  it('a soma dos pedaços de cada produto é o total dele', () => {
    const forms: CartForm[] = [{ kind: 'benefit', id: 10, amount: 3333 }, { kind: 'card', id: 5, amount: 10000, installments: 1 }, { kind: 'balance', amount: 7097 }];
    const result = distribute(lines, forms, [VR]);
    for (const line of lines) expect(result.pieces.filter((p) => p.lineId === line.id).reduce((n, p) => n + p.amount, 0)).toBe(line.total);
  });

  it('dois benefícios dividem as categorias na ordem em que aparecem', () => {
    const second: BenefitCap = { id: 11, divided: false, available: 99999, byCategory: {} };
    const forms: CartForm[] = [{ kind: 'benefit', id: 10, amount: 8430 }, { kind: 'benefit', id: 11, amount: 12000 }];
    const result = distribute(lines, forms, [VR, second]);
    expect(piecesOf(result)).toEqual([[2, 0, 6580], [3, 0, 1850], [1, 1, 12000]]);
  });

  it('o disponível da categoria é consumido pelos produtos na ordem do carrinho', () => {
    const tight: BenefitCap = { ...VR, byCategory: { 1: 7000 } };
    const result = distribute(lines, [{ kind: 'benefit', id: 10, amount: 7000 }, { kind: 'balance', amount: 13430 }], [tight]);
    expect(piecesOf(result).filter(([, form]) => form === 0)).toEqual([[2, 0, 6580], [3, 0, 420]]);
  });

  it('forma que não consegue preencher o valor deixa falta', () => {
    const result = distribute(lines, [{ kind: 'benefit', id: 10, amount: 10000 }, { kind: 'balance', amount: 10430 }], [VR]);
    expect(result.short[0]).toBe(10000 - 8430);
  });
});

describe('validação (RN-06)', () => {
  const ok: CartForm[] = [{ kind: 'benefit', id: 10, amount: 8430 }, { kind: 'card', id: 5, amount: 12000, installments: 3 }];
  const codes = (forms: CartForm[], caps = [VR]) => validateForms(lines, forms, caps).issues.map((i) => i.code);

  it('uma divisão que fecha o total é válida', () => {
    expect(validateForms(lines, ok, [VR])).toMatchObject({ issues: [], left: 0, total: 20430 });
  });

  it('soma menor ou maior que o total', () => {
    expect(validateForms(lines, [{ kind: 'benefit', id: 10, amount: 8430 }], [VR])).toMatchObject({ left: 12000, issues: [{ code: 'sum', formIndex: null, limit: 12000 }] });
    expect(validateForms(lines, [{ kind: 'balance', amount: 25000 }], [])).toMatchObject({ left: -4570 });
  });

  it('valor zero ou negativo', () => {
    expect(codes([{ kind: 'balance', amount: 20430 }, { kind: 'card', id: 5, amount: 0, installments: 1 }])).toContain('amount');
  });

  it('benefício acima da cobertura', () => {
    const result = validateForms(lines, [{ kind: 'benefit', id: 10, amount: 10000 }, { kind: 'balance', amount: 10430 }], [VR]);
    expect(result.issues).toEqual([{ code: 'limit', formIndex: 0, limit: 8430 }]);
  });

  it('a mesma forma duas vezes', () => {
    expect(codes([{ kind: 'card', id: 5, amount: 10000, installments: 1 }, { kind: 'card', id: 5, amount: 10430, installments: 1 }])).toContain('duplicate');
  });

  it('cartões diferentes são formas diferentes', () => {
    expect(codes([{ kind: 'card', id: 5, amount: 10000, installments: 1 }, { kind: 'card', id: 6, amount: 10430, installments: 1 }])).toEqual([]);
  });

  it('parcelas fora de 1, 2, 3, 6 e 12', () => {
    expect(codes([{ kind: 'card', id: 5, amount: 20430, installments: 4 }])).toContain('installments');
    expect(codes([{ kind: 'card', id: 5, amount: 20430, installments: 12 }])).toEqual([]);
  });

  it('forma que não existe mais', () => {
    const result = validateForms(lines, [{ kind: 'card', id: 99, amount: 20430, installments: 1 }], [], () => false);
    expect(result.issues.map((i) => i.code)).toContain('missing');
  });

  it('dois benefícios que disputam os mesmos produtos deixam falta', () => {
    const twin: BenefitCap = { ...VR, id: 11 };
    // Cada um cobre 84,30, mas juntos só há 84,30 de Alimentação para pagar.
    const result = validateForms(lines, [{ kind: 'benefit', id: 10, amount: 8430 }, { kind: 'benefit', id: 11, amount: 8430 }, { kind: 'balance', amount: 3570 }], [VR, twin]);
    expect(result.issues.some((i) => i.code === 'fill' || i.code === 'sum')).toBe(true);
  });
});

describe('sugerir divisão (D9)', () => {
  it('benefício no máximo da cobertura e o resto no primeiro cartão', () => {
    expect(suggestForms(lines, [VR], 5)).toEqual([{ kind: 'benefit', id: 10, amount: 8430 }, { kind: 'card', id: 5, amount: 12000, installments: 1 }]);
  });

  it('sem cartão o resto vai para o saldo', () => {
    expect(suggestForms(lines, [VR], null)).toEqual([{ kind: 'benefit', id: 10, amount: 8430 }, { kind: 'balance', amount: 12000 }]);
  });

  it('benefício que cobre tudo não deixa resto', () => {
    const food = [ARROZ, CAFE];
    expect(suggestForms(food, [VR], 5)).toEqual([{ kind: 'benefit', id: 10, amount: 8430 }]);
  });

  it('sem cobertura só o cartão', () => {
    expect(suggestForms(lines, [{ ...VR, byCategory: {} }], 5)).toEqual([{ kind: 'card', id: 5, amount: 20430, installments: 1 }]);
  });

  it('a sugestão sempre passa na validação', () => {
    const forms = suggestForms(lines, [VR, { id: 11, divided: false, available: 3000, byCategory: {} }], 5);
    expect(validateForms(lines, forms, [VR, { id: 11, divided: false, available: 3000, byCategory: {} }]).issues).toEqual([]);
  });
});
