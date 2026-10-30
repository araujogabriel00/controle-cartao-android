import { describe, expect, it } from 'vitest';
import { invoiceColumns, niceScale, topCategories } from '@/lib/card-series';

describe('niceScale', () => {
  it('arredonda para marcas redondas', () => {
    expect(niceScale(930)).toEqual({ top: 1000, ticks: [250, 500, 750, 1000] });
    expect(niceScale(100).top).toBe(100);
  });
  it('sem máximo usa 1..marks', () => {
    expect(niceScale(0)).toEqual({ top: 4, ticks: [1, 2, 3, 4] });
  });
});

describe('invoiceColumns', () => {
  it('histórico até o mês atual, previsto depois', () => {
    const cols = invoiceColumns('2026-09', [{ month: '2026-09', invoiceAmount: 100 }], [{ month: '2026-11', amount: 50 }], 4);
    expect(cols).toEqual([
      { month: '2026-09', amount: 100, planned: false },
      { month: '2026-10', amount: 0, planned: false },
      { month: '2026-11', amount: 50, planned: true },
      { month: '2026-12', amount: 0, planned: true },
    ]);
  });
});

describe('topCategories', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ key: `c${i}`, label: `C${i}`, amount: 10.1, percent: 12 }));
  it('mantém todas até o limite', () => {
    expect(topCategories(items.slice(0, 6))).toHaveLength(6);
  });
  it('soma o resto em Outras', () => {
    const rows = topCategories(items);
    expect(rows).toHaveLength(7);
    expect(rows[6]).toMatchObject({ label: 'Outras', other: true, amount: 20.2, percent: 24 });
  });
});
