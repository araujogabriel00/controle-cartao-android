import { useLocation } from 'wouter';
import { getGetIncomeRangeQueryKey, getGetMonthCashQueryKey, useGetIncomeRange, useGetMonthCash } from '@workspace/api-client-react';
import { ChevronRight } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { MonthNav } from '@/components/month-nav';
import { useRememberMonth } from '@/lib/last-month';
import { listPath, money, type MonthKey } from '@/lib/format';

// specs/redesign-entradas.md RF-04: entradas levam "+", saídas levam "−" e o zero fica sem sinal e apagado.
const NBSP = ' ';
const signed = (value: number | undefined, kind: 'in' | 'out') =>
  (value ?? 0) > 0 ? `${kind === 'in' ? '+' : '−'}${NBSP}${money(value)}` : money(value);
const tone = (value: number | undefined, kind: 'in' | 'out') =>
  (value ?? 0) > 0 ? (kind === 'in' ? 'font-medium text-brand' : 'font-medium text-ink') : 'text-ink-soft';

export default function Entradas({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const cash = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } }).data;
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const negative = (cash?.balanceAmount ?? 0) < 0;
  const result = cash?.resultAmount ?? 0;

  const rows = [
    { id: 'income', label: 'Entradas', value: cash?.incomeAmount, list: 'entradas', kind: 'in' },
    { id: 'bills', label: 'Contas fixas', value: cash?.billsAmount, list: 'contas-fixas', kind: 'out' },
    { id: 'daily', label: 'Gastos do dia a dia', value: cash?.dailyAmount, list: 'gastos', kind: 'out' },
    { id: 'cards', label: 'Cartões', value: cash?.cardsAmount, list: 'cartoes', kind: 'out' },
  ] as const;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <MonthNav area="income" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>
      <AppTabs/>

      {/* RF-01, RF-02, RF-08: o saldo é o primeiro bloco, com a conta que o gera logo abaixo. */}
      <section data-testid="section-balance" aria-label="Saldo" className={`enter mt-4 flex flex-col gap-1 rounded-[24px] px-5 pb-[18px] pt-5 text-on-brand ${negative ? 'bg-alert' : 'bg-brand'}`} style={{ animationDelay: '.08s' }}>
        <span className="text-sm font-medium text-on-brand-soft">Saldo</span>
        <p data-testid="text-cash-balance" className="font-mono-data text-[34px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] min-[380px]:text-[38px]">{money(cash?.balanceAmount)}</p>
        {negative && <p data-testid="text-cash-warning" className="mt-1 text-[13px] text-on-brand">As saídas passaram das entradas e do saldo anterior.</p>}
        {/* D12: o que veio dos meses anteriores, o mês sozinho, e a soma dos dois. */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-on-brand/20 pt-3.5">
          <div className="flex min-w-0 flex-col gap-0.5"><span className="text-[13px] text-on-brand-soft">Saldo anterior</span><p data-testid="text-cash-previous" className="font-mono-data text-base [overflow-wrap:anywhere]">{money(cash?.previousAmount)}</p></div>
          <div className="flex min-w-0 flex-col gap-0.5"><span className="text-[13px] text-on-brand-soft">Resultado do mês</span><p data-testid="text-cash-result" className="font-mono-data text-base [overflow-wrap:anywhere]">{result >= 0 ? `+${NBSP}` : ''}{money(result)}</p></div>
        </div>
      </section>

      {/* RF-03, RF-04: as quatro origens do mês, uma por linha. */}
      <section data-testid="section-cash" aria-label="Resumo do mês" className="enter mt-3 overflow-hidden rounded-[24px] border border-line bg-surface" style={{ animationDelay: '.12s' }}>
        <h2 className="px-5 pb-3 pt-4 text-[13px] font-semibold text-ink-soft">Resumo do mês</h2>
        {rows.map((row) => <button key={row.id} data-testid={`tile-${row.id}`} aria-label={`Abrir ${row.label}`} onClick={() => navigate(listPath(row.list, month))} className="flex min-h-[60px] w-full items-center justify-between gap-3 border-t border-line px-5 text-left text-ink transition hover:bg-paper/60">
          <span className="text-[15px] font-medium">{row.label}</span>
          <span className="flex min-w-0 items-center gap-2"><span data-testid={`text-cash-${row.id}`} className={`font-mono-data text-base [overflow-wrap:anywhere] ${tone(row.value, row.kind)}`}>{signed(row.value, row.kind)}</span><ChevronRight size={16} className="shrink-0 text-ink-soft"/></span>
        </button>)}
      </section>
    </div>
  </main>;
}
