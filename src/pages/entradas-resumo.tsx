import { useLocation } from 'wouter';
import { getGetMonthCashQueryKey, useGetMonthCash } from '@workspace/api-client-react';
import { ArrowLeft, ChevronRight, CircleHelp } from 'lucide-react';
import { areaPath, capitalize, listPath, money, monthLabel, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

// specs/redesign-entradas.md RF-04: entradas levam "+", saídas levam "−" e o zero fica sem sinal e apagado.
const NBSP = ' ';
const signed = (value: number | undefined, kind: 'in' | 'out') =>
  (value ?? 0) > 0 ? `${kind === 'in' ? '+' : '−'}${NBSP}${money(value)}` : money(value);
const tone = (value: number | undefined, kind: 'in' | 'out') =>
  (value ?? 0) > 0 ? (kind === 'in' ? 'font-medium text-brand' : 'font-medium text-ink') : 'text-ink-soft';

// specs/redesign-opcao-d-entradas.md D9: tela de apoio aberta pelo botão "Resumo" do rodapé.
export default function EntradasResumo({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const cashQuery = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } });
  const cash = cashQuery.data;
  const result = cash?.resultAmount ?? 0;

  const rows = [
    { id: 'income', label: 'Entradas', value: cash?.incomeAmount, list: 'entradas', kind: 'in' },
    { id: 'bills', label: 'Contas fixas', value: cash?.billsAmount, list: 'contas-fixas', kind: 'out' },
    { id: 'daily', label: 'Gastos do dia a dia', value: cash?.dailyAmount, list: 'gastos', kind: 'out' },
    { id: 'cards', label: 'Cartões', value: cash?.cardsAmount, list: 'cartoes', kind: 'out' },
  ] as const;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <button data-testid="button-back" aria-label="Voltar" onClick={() => navigate(areaPath('income', month))} className="-ml-2 flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-brand transition hover:bg-[#ece7dc]"><ArrowLeft size={20}/>Voltar</button>
      <p className="mt-3 font-mono-data text-xs uppercase tracking-[.08em] text-eyebrow">{capitalize(monthLabel(month))}</p>
      <h1 className="font-display text-[32px] leading-tight text-ink">Resumo do mês</h1>

      {cashQuery.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir o resumo.</h3><button onClick={() => void cashQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
        : !cash ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-14 animate-pulse rounded-2xl bg-line"/><div className="h-64 animate-pulse rounded-2xl bg-line"/></div>
        : <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-0.5"><span className="text-xs text-ink-soft">Saldo anterior</span><p data-testid="text-cash-previous" className="font-mono-data text-[15px] [overflow-wrap:anywhere]">{money(cash.previousAmount)}</p></div>
            <div className="flex min-w-0 flex-col gap-0.5"><span className="text-xs text-ink-soft">Resultado do mês</span><p data-testid="text-cash-result" className={`font-mono-data text-[15px] [overflow-wrap:anywhere] ${result < 0 ? 'text-alert' : ''}`}>{result >= 0 ? `+${NBSP}` : ''}{money(result)}</p></div>
          </div>

          <section data-testid="section-cash" aria-label="Resumo do mês" className="mt-5 border-b border-line">
            {rows.map((row) => <button key={row.id} data-testid={`tile-${row.id}`} aria-label={`Abrir ${row.label}`} onClick={() => navigate(listPath(row.list, month))} className="flex min-h-16 w-full items-center justify-between gap-3 border-t border-line text-left text-ink transition hover:bg-surface">
              <span className="text-[15px] font-medium">{row.label}</span>
              <span className="flex min-w-0 items-center gap-2"><span data-testid={`text-cash-${row.id}`} className={`font-mono-data text-base [overflow-wrap:anywhere] ${tone(row.value, row.kind)}`}>{signed(row.value, row.kind)}</span><ChevronRight size={16} className="shrink-0 text-ink-soft"/></span>
            </button>)}
          </section>
        </>}
    </div>
  </main>;
}
