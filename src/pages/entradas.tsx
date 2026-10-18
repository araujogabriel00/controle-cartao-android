import { useLocation } from 'wouter';
import { getGetIncomeRangeQueryKey, getGetMonthCashQueryKey, useGetIncomeRange, useGetMonthCash } from '@workspace/api-client-react';
import { ChevronRight } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { MonthNav } from '@/components/month-nav';
import { useRememberMonth } from '@/lib/last-month';
import { capitalize, listPath, money, monthLabel, type MonthKey } from '@/lib/format';

export default function Entradas({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const cash = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } }).data;
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const negative = (cash?.balanceAmount ?? 0) < 0;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <MonthNav area="income" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>
      <AppTabs/>

      <section data-testid="section-cash" aria-label="Resumo do mês" className="enter mt-6 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-4 sm:p-5" style={{ animationDelay: '.08s' }}>
        <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Resumo do mês · {capitalize(monthLabel(month))}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {([['Entradas', cash?.incomeAmount, 'income', 'text-[#315944]', 'entradas'], ['Contas fixas', cash?.billsAmount, 'bills', 'text-[#a55f50]', 'contas-fixas'], ['Gastos do dia a dia', cash?.dailyAmount, 'daily', 'text-[#a55f50]', 'gastos'], ['Cartões', cash?.cardsAmount, 'cards', 'text-[#a55f50]', 'cartoes']] as const).map(([label, value, id, tone, list]) => {
            const body = <><span className="flex items-center justify-between gap-1 text-[10px] text-[#7c877a]">{label}<ChevronRight size={13} className="shrink-0 text-[#9aa497]"/></span><p data-testid={`text-cash-${id}`} className={`mt-1 font-mono-data text-[13px] [overflow-wrap:anywhere] sm:text-[15px] ${tone}`}>{money(value)}</p></>;
            return <button key={id} data-testid={`tile-${id}`} aria-label={`Abrir ${label}`} onClick={() => navigate(listPath(list, month))} className="min-w-0 rounded-2xl bg-[#f2eee4] p-3 text-left transition hover:bg-[#ece7da]">{body}</button>;
          })}
        </div>
        {/* D12: what came from the months before, the month on its own, and their sum. */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
          {([['Saldo anterior', cash?.previousAmount, 'previous'], ['Resultado do mês', cash?.resultAmount, 'result']] as const).map(([label, value, id]) =>
            <div key={id} className="min-w-0 rounded-2xl bg-[#f2eee4] p-3"><span className="text-[10px] text-[#7c877a]">{label}</span><p data-testid={`text-cash-${id}`} className={`mt-1 font-mono-data text-[13px] [overflow-wrap:anywhere] sm:text-[15px] ${(value ?? 0) < 0 ? 'text-[#a55f50]' : 'text-[#315944]'}`}>{money(value)}</p></div>)}
        </div>
        <div className={`mt-3 rounded-2xl p-4 ${negative ? 'bg-[#f5e9e1]' : 'bg-[#e4ece2]'}`}>
          <span className={`text-[10px] ${negative ? 'text-[#927b70]' : 'text-[#5f7a66]'}`}>Saldo</span>
          <p data-testid="text-cash-balance" className={`mt-1 font-mono-data text-[26px] [overflow-wrap:anywhere] ${negative ? 'text-[#a55f50]' : 'text-[#315944]'}`}>{money(cash?.balanceAmount)}</p>
          {negative && <p data-testid="text-cash-warning" className="mt-1 text-[11px] text-[#8c5a4c]">As saídas passaram das entradas e do saldo anterior.</p>}
        </div>
      </section>

    </div>
  </main>;
}
