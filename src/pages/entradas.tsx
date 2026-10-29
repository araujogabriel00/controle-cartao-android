import { getGetIncomeRangeQueryKey, getGetMonthCashQueryKey, useGetIncomeRange, useGetMonthCash } from '@workspace/api-client-react';
import { CircleHelp } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { ChartLegend } from '@/components/charts/chart-legend';
import { DivergingBars } from '@/components/charts/diverging-bars';
import { MonthNav } from '@/components/month-nav';
import { useRememberMonth } from '@/lib/last-month';
import { money, type MonthKey } from '@/lib/format';

// specs/redesign-opcao-d-entradas.md: a aba mostra o saldo sem card e o gráfico "Entrou e saiu".
// O resumo em quatro linhas, o saldo anterior e o resultado ficam na tela Resumo do mês.
export default function Entradas({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const cashQuery = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } });
  const cash = cashQuery.data;
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const negative = (cash?.balanceAmount ?? 0) < 0;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <MonthNav area="income" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>
      <AppTabs/>

      {cashQuery.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as entradas.</h3><button onClick={() => void cashQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
        : !cash ? <div aria-busy="true" className="mt-6 space-y-4"><div className="h-[84px] animate-pulse rounded-2xl bg-line"/><div className="h-[320px] animate-pulse rounded-2xl bg-line"/></div>
        : <>
          {/* D1, D6: saldo grande, sem card; negativo na cor de alerta com o aviso de sempre. */}
          <section data-testid="section-balance" aria-label="Saldo" className="enter mt-6" style={{ animationDelay: '.08s' }}>
            <span className="text-sm font-medium text-ink-soft">Saldo</span>
            <p data-testid="text-cash-balance" className={`font-display text-[44px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] min-[380px]:text-[52px] ${negative ? 'text-alert' : 'text-ink'}`}>{money(cash.balanceAmount)}</p>
            {negative && <p data-testid="text-cash-warning" className="mt-1 text-[14px] text-alert">As saídas passaram das entradas e do saldo anterior.</p>}
          </section>

          {/* D2 a D5: o que entrou, o que saiu e o que ficou, numa escala só. */}
          <section data-testid="section-chart" aria-label="Entrou e saiu" className="enter mt-8" style={{ animationDelay: '.12s' }}>
            <h2 className="font-display text-2xl text-ink">Entrou e saiu</h2>
            <p className="mb-3 text-sm text-ink-soft">Por tipo, no mês, em R$</p>
            <DivergingBars
              rows={[
                { label: 'Entradas', value: cash.incomeAmount ?? 0, tone: 'in' },
                { label: 'Contas fixas', value: cash.billsAmount ?? 0, tone: 'out' },
                { label: 'Gastos do dia a dia', value: cash.dailyAmount ?? 0, tone: 'out' },
                { label: 'Cartões', value: cash.cardsAmount ?? 0, tone: 'out' },
              ]}
              result={{ label: 'Resultado do mês', value: cash.resultAmount ?? 0 }}/>
            <ChartLegend items={[{ label: 'Entrou', swatch: 'bg-chart-in' }, { label: 'Saiu', swatch: 'bg-chart-out' }]}/>
          </section>
        </>}
    </div>
  </main>;
}
