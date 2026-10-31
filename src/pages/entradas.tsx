import { useState } from 'react';
import {
  getGetBillsQueryKey, getGetCardsQueryKey, getGetDailyExpensesQueryKey, getGetDreamEntriesQueryKey, getGetIncomeRangeQueryKey, getGetIncomesQueryKey, getGetMonthCashQueryKey,
  useGetBalanceSeries, useGetBills, useGetCards, useGetDailyExpenses, useGetDreamEntries, useGetIncomeRange, useGetIncomes, useGetMonthCash,
} from '@workspace/api-client-react';
import { ChevronRight, CircleHelp, CreditCard, HandCoins, Moon, Receipt, ShoppingBasket } from 'lucide-react';
import { useLocation } from 'wouter';
import { AppHeader } from '@/components/app-header';
import { BalanceLine, shortMonth } from '@/components/charts/balance-line';
import { OriginRows } from '@/components/origin-rows';
import { useRememberMonth } from '@/lib/last-month';
import { listPath, money, plural, summaryPath, type ListKind, type MonthKey } from '@/lib/format';

const NBSP = ' ';
const BALANCE_MONTHS = 6;

// "+ R$ 4.109,84" / "− R$ 520,00": o sinal diz o mesmo que a cor (D6).
const signed = (value: number) => (value > 0 ? `+${NBSP}${money(value)}` : value < 0 ? `−${NBSP}${money(-value)}` : money(value));

// RF-06: "1 lançamento" / "N lançamentos"; sem itens, "nenhum" (masculino) ou "nenhuma" (feminino) neste mês. Sem leitura, sem texto (RN-07).
const countText = (count: number | undefined, one: string, many: string, none: string) => (count === undefined ? undefined : count === 0 ? none : plural(count, one, many));

// "1 aporte" / "2 aportes e 1 retirada"; sem lançamentos, "nenhum neste mês". Sem leitura, sem texto (RN-07).
const dreamCountText = (data?: { depositCount: number; withdrawCount: number }) => {
  if (!data) return undefined;
  const parts = [data.depositCount > 0 && plural(data.depositCount, 'aporte', 'aportes'), data.withdrawCount > 0 && plural(data.withdrawCount, 'retirada', 'retiradas')].filter(Boolean);
  return parts.length ? parts.join(' e ') : 'nenhum neste mês';
};

// specs/redesign-v2-entradas.md (desenho v3): o saldo com o resultado do mês, o gráfico "Saldo mês a mês" e as quatro origens
// como linhas. O resumo em quatro linhas, o saldo anterior e o resultado ficam na tela Resumo do mês.
export default function Entradas({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  useRememberMonth(month);
  const [picked, setPicked] = useState<MonthKey | null>(null);
  const series = useGetBalanceSeries(month, BALANCE_MONTHS);
  const incomes = useGetIncomes(month, { query: { queryKey: getGetIncomesQueryKey(month) } });
  const bills = useGetBills(month, { query: { queryKey: getGetBillsQueryKey(month) } });
  const daily = useGetDailyExpenses(month, { query: { queryKey: getGetDailyExpensesQueryKey(month) } });
  const cards = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month) } });
  const dreams = useGetDreamEntries(month, { query: { queryKey: getGetDreamEntriesQueryKey(month) } });
  const cashQuery = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } });
  const cash = cashQuery.data;
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const negative = (cash?.balanceAmount ?? 0) < 0;

  // D3: sem escolha, o mês aberto (o último ponto da série).
  const points = (series.data ?? []).map((p) => ({ month: p.month, value: p.balanceAmount }));
  const chosen = points.find((p) => p.month === picked) ?? points[points.length - 1];

  // RF-04 a RF-06: as quatro origens, na ordem de sempre, cada uma abrindo a lista do mês aberto.
  const origins = [
    { id: 'income', label: 'Entradas', icon: <HandCoins size={18}/>, value: cash?.incomeAmount ?? 0, kind: 'in' as const, count: countText(incomes.data ? incomes.data.items.length + incomes.data.forecastItems.length : undefined, 'lançamento', 'lançamentos', 'nenhum neste mês'), list: 'entradas' as ListKind },
    { id: 'bills', label: 'Contas fixas', icon: <Receipt size={18}/>, value: cash?.billsAmount ?? 0, kind: 'out' as const, count: countText(bills.data ? bills.data.items.length + bills.data.forecastItems.length : undefined, 'conta', 'contas', 'nenhuma neste mês'), list: 'contas-fixas' as ListKind },
    { id: 'daily', label: 'Gastos do dia a dia', icon: <ShoppingBasket size={18}/>, value: cash?.dailyAmount ?? 0, kind: 'out' as const, count: countText(daily.data ? daily.data.items.length + daily.data.forecastItems.length : undefined, 'gasto', 'gastos', 'nenhum neste mês'), list: 'gastos' as ListKind },
    { id: 'cards', label: 'Cartões', icon: <CreditCard size={18}/>, value: cash?.cardsAmount ?? 0, kind: 'out' as const, count: countText(cards.data?.cards.filter((card) => card.invoiceAmount > 0).length, 'fatura', 'faturas', 'nenhuma neste mês'), list: 'cartoes' as ListKind },
    // Sonhos D8: aportes − retiradas do mês. Guardar é saída (−); se as retiradas passam dos aportes, a linha vira entrada (+).
    { id: 'dreams', label: 'Guardado em sonhos', icon: <Moon size={18}/>, value: Math.abs(cash?.savingsAmount ?? 0), kind: (cash?.savingsAmount ?? 0) < 0 ? 'in' as const : 'out' as const, count: dreamCountText(dreams.data), list: 'sonhos' as ListKind },
  ].map(({ list, ...row }) => ({ ...row, onOpen: () => navigate(listPath(list, month)) }));

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppHeader area="income" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>

      {cashQuery.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as entradas.</h3><button onClick={() => void cashQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
        : !cash ? <div aria-busy="true" className="mt-6 space-y-4"><div className="h-[84px] animate-pulse rounded-2xl bg-line"/><div className="h-[250px] animate-pulse rounded-2xl bg-line"/><div className="h-[320px] animate-pulse rounded-2xl bg-line"/></div>
        : <>
          {/* D1, D8: o saldo em destaque com o resultado do mês; negativo na cor de alerta com o aviso de sempre. */}
          <section data-testid="section-balance" aria-label="Saldo" className="enter mt-6" style={{ animationDelay: '.08s' }}>
            <span className="text-sm font-medium text-ink-soft">Saldo</span>
            <p data-testid="text-cash-balance" className={`font-display text-[34px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] ${negative ? 'text-alert' : 'text-ink'}`}>{money(cash.balanceAmount)}</p>
            <p data-testid="text-cash-result" className="mt-1 text-[14px] text-ink-soft">{signed(cash.resultAmount ?? 0)} neste mês</p>
            {negative && <p data-testid="text-cash-warning" className="mt-1 text-[14px] text-alert">As saídas passaram das entradas e do saldo anterior.</p>}
          </section>

          {/* D2, D3: o saldo ao fim de cada um dos últimos 6 meses; tocar num mês (ou as setas) mostra o saldo dele. */}
          <section data-testid="section-chart" aria-label="Saldo mês a mês" className="enter mt-8" style={{ animationDelay: '.12s' }}>
            <h2 className="font-display text-[20px] text-ink">Saldo mês a mês</h2>
            {series.isError ? <div className="mt-3 rounded-2xl border border-line bg-surface px-4 py-6 text-center"><p data-testid="text-chart-note" className="text-[14px] text-ink-soft">Gráfico indisponível</p><button onClick={() => void series.refetch()} className="mt-2 h-12 rounded-full border border-line px-5 text-[15px] font-semibold text-brand transition hover:bg-hover">Tentar novamente</button></div>
              : series.isLoading ? <div aria-busy="true" className="mt-3 h-[170px] animate-pulse rounded-lg bg-line"/>
              : points.length < 2 ? <p data-testid="text-chart-note" className="mt-1 text-[14px] text-ink-soft">Ainda sem histórico.</p>
              : <>
                <p data-testid="text-balance-selected" aria-live="polite" className="mb-2 text-[14px] text-ink-soft">{shortMonth(chosen.month)}: <span className="font-semibold text-ink">{money(chosen.value)}</span></p>
                <BalanceLine points={points} selected={chosen.month} onSelect={setPicked}/>
              </>}
          </section>

          {/* D4 a D7: as quatro origens como linhas de um cartão; o link "Resumo" abre o Resumo do mês. */}
          <section aria-label="Entrou e saiu" className="enter mt-8 overflow-hidden rounded-2xl border border-line bg-surface" style={{ animationDelay: '.16s' }}>
            <div className="flex items-center justify-between gap-2 pl-4 pr-2 pt-2">
              <h2 className="font-display text-[20px] text-ink">Entrou e saiu</h2>
              <button data-testid="button-summary" onClick={() => navigate(summaryPath(month))} className="flex h-12 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-brand transition hover:bg-hover">Resumo<ChevronRight size={18}/></button>
            </div>
            <OriginRows income={cash.incomeAmount ?? 0} rows={origins}/>
          </section>
        </>}
    </div>
  </main>;
}
