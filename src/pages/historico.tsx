import { useLocation } from 'wouter';
import {
  getGetCardsQueryKey, getGetConsolidatedHistoryQueryKey, getGetFutureInstallmentsQueryKey, getGetMonthHistoryQueryKey,
  useGetCards, useGetConsolidatedHistory, useGetFutureInstallments, useGetMonthHistory,
} from '@workspace/api-client-react';
import { CalendarClock, ChevronRight, CircleHelp, History } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { BackButton } from '@/components/back-button';
import { Columns } from '@/components/charts/columns';
import { capitalize, currentMonth, money, monthLabel, monthPath } from '@/lib/format';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// Histórico na Opção D (specs/redesign-opcao-d-telas-de-apoio.md D7): voltar, título de 28 px, gráfico de colunas
// com os últimos 12 meses iniciados (mesma regra de `columns.tsx`) e a lista de meses logo abaixo, como tabela.
export default function Historico() {
  const [, navigate] = useLocation();
  const month = currentMonth();
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month), refetchOnWindowFocus: true } });
  const cards = cardsQuery.data?.cards ?? [];
  const card = cards.find((item) => item.id === cardsQuery.data?.selectedCardId);
  const cardId = card?.id ?? 0;
  const history = useGetMonthHistory(cardId, { query: { queryKey: getGetMonthHistoryQueryKey(cardId), enabled: !cardsQuery.isLoading, refetchOnWindowFocus: true } });
  const allCards = useGetConsolidatedHistory({ query: { queryKey: getGetConsolidatedHistoryQueryKey(), enabled: cards.length > 1, refetchOnWindowFocus: true } }).data;
  const totalOf = (key: string) => cards.length > 1 ? allCards?.find((item) => item.month === key) : undefined;
  const upcoming = useGetFutureInstallments(cardId, { query: { queryKey: getGetFutureInstallmentsQueryKey(cardId), enabled: Boolean(card), refetchOnWindowFocus: true } }).data ?? [];
  const months = history.data ?? [];
  const loading = cardsQuery.isLoading || history.isLoading;
  const columns = months.slice(0, 12).reverse().map((item) => ({ month: item.month, amount: item.invoiceAmount, planned: false }));

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => navigate('/')}/>
      <AppTabs/>

      <section className="enter mt-5" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-eyebrow"><History size={14}/><p className="font-mono-data text-xs uppercase tracking-[.08em]">Histórico</p></div>
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">Mês a mês</h1>
        <p className="mt-1 text-[15px] text-ink-soft">{card ? <><b data-testid="text-history-card" className="font-semibold text-ink">{card.name}</b> — a fatura de cada mês.</> : 'A fatura do cartão em cada mês.'}</p>
      </section>

      {loading ? <div className="mt-8 space-y-4 animate-pulse"><div className="h-40 rounded-2xl bg-line"/><div className="h-36 rounded-2xl bg-line"/></div>
      : history.isError || cardsQuery.isError ? <div className="mt-8 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir o histórico.</h3><button onClick={() => { void cardsQuery.refetch(); void history.refetch(); }} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : <>
        {columns.length > 0 && <section data-testid="section-history-chart" aria-label="Fatura por mês" className="enter mt-6" style={{ animationDelay: '.08s' }}>
          <h2 className="font-display text-2xl text-ink">Fatura por mês</h2>
          <p className="mb-3 text-sm text-ink-soft">Os últimos {plural(columns.length, 'mês', 'meses')}, em R$</p>
          <Columns columns={columns} caption="Fatura do cartão por mês" ariaLabel={`Fatura do cartão por mês: ${columns.map((col) => `${capitalize(monthLabel(col.month))} ${money(col.amount)}`).join(', ')}`}/>
        </section>}

        {upcoming.length > 0 && <section data-testid="section-upcoming" aria-labelledby="upcoming-title" className="enter mt-8" style={{ animationDelay: '.1s' }}>
          <div className="flex items-center gap-2 text-eyebrow"><CalendarClock size={14}/><h2 id="upcoming-title" className="font-mono-data text-xs uppercase tracking-[.08em]">Próximos meses</h2></div>
          <p className="mb-2 mt-1 text-[14px] text-ink-soft">Parcelas e cobranças previstas e compras já registradas nos próximos meses.</p>
          <div className="divide-y divide-line border-y border-line">
            {upcoming.map((item) => <button key={item.month} data-testid={`row-upcoming-${item.month}`} onClick={() => navigate(monthPath(item.month))} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-surface">
              <span className="min-w-0"><span className="block truncate text-[15px] font-semibold text-ink">{capitalize(monthLabel(item.month))}</span><span className="text-[13px] text-ink-soft">{plural(item.count, 'item', 'itens')}</span></span>
              <span className="flex shrink-0 items-center gap-2"><span className="font-mono-data text-[15px] text-ink">{money(item.amount)}</span><ChevronRight size={16} className="text-ink-soft"/></span>
            </button>)}
          </div>
        </section>}

        {months.length ? <section className="enter mt-8" style={{ animationDelay: '.12s' }}>
          <h2 className="font-display text-2xl text-ink">Todos os meses</h2>
          <div className="mt-2 divide-y divide-line border-y border-line">
            {months.map((item) => <button key={item.month} data-testid={`card-month-${item.month}`} onClick={() => navigate(monthPath(item.month))} className="block min-h-16 w-full py-3 text-left transition hover:bg-surface">
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0"><span className="block truncate text-[15px] font-semibold text-ink">{capitalize(monthLabel(item.month))}</span><span className="text-[13px] text-ink-soft">{plural(item.movementCount, 'compra', 'compras')}</span></span>
                <span className="flex shrink-0 items-center gap-2"><span className="font-mono-data text-[15px] text-ink">{money(item.invoiceAmount)}</span><ChevronRight size={16} className="text-ink-soft"/></span>
              </span>
              {totalOf(item.month) && <span data-testid={`text-all-cards-${item.month}`} className="mt-1 block text-[13px] text-ink-soft"><b className="font-semibold text-ink">Todos os cartões:</b> fatura <span className="font-mono-data text-ink">{money(totalOf(item.month)?.invoiceAmount)}</span></span>}
            </button>)}
          </div>
        </section>
        : <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8e9df] text-brand"><History size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Nada por aqui ainda.</h3><p className="mx-auto mt-1 max-w-xs text-[14px] leading-5 text-ink-soft">Seu histórico começa quando você cadastrar o cartão.</p></div>}
      </>}
    </div>
  </main>;
}
