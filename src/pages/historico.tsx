import { useLocation } from 'wouter';
import {
  getGetCardsQueryKey, getGetConsolidatedHistoryQueryKey, getGetFutureInstallmentsQueryKey, getGetMonthHistoryQueryKey,
  useGetCards, useGetConsolidatedHistory, useGetFutureInstallments, useGetMonthHistory,
} from '@workspace/api-client-react';
import { ArrowLeft, CalendarClock, CalendarDays, ChevronRight, CircleHelp, History, WalletCards } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { Progress } from '@/components/progress';
import { capitalize, currentMonth, money, monthLabel, monthPath } from '@/lib/format';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

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

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-between border-b border-[#ded8ca] pb-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#28513f] text-[#f4d48b]"><WalletCards size={20}/></div><div><p className="font-display text-[20px] font-semibold leading-none text-[#234638]">controle<span className="text-[#d78470]">.</span></p><p className="mt-1 font-mono-data text-[9px] uppercase tracking-[.19em] text-[#758075]">do cartão</p></div></div>
        <button data-testid="button-back" onClick={() => navigate('/')} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><ArrowLeft size={14}/> Mês atual</button>
      </header>
      <AppTabs/>

      <section className="enter mt-9 sm:mt-12" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-[#ac8f60]"><History size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Histórico</p></div>
        <h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[54px]">Mês a <em className="font-medium text-[#d78470]">mês.</em></h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#6e7a6f]">{card ? <><b data-testid="text-history-card" className="font-semibold text-[#42624d]">{card.name}</b> — quanto</> : 'Quanto'} o cartão usou do limite em cada mês.</p>
      </section>

      {!loading && upcoming.length > 0 && <section data-testid="section-upcoming" aria-labelledby="upcoming-title" className="enter mt-8 rounded-[22px] border border-[#e6d7b8] bg-[#f8efd9] p-4 sm:p-5" style={{ animationDelay: '.08s' }}>
        <div className="flex items-center gap-2 text-[#9a7d45]"><CalendarClock size={14}/><h2 id="upcoming-title" className="font-mono-data text-[10px] uppercase tracking-[.2em]">Próximos meses</h2></div>
        <p className="mt-1 text-[11px] text-[#7a6a45]">Parcelas e cobranças previstas e compras já registradas nos próximos meses.</p>
        <div className="mt-3 divide-y divide-[#ead9b4]">
          {upcoming.map((item) => <button key={item.month} data-testid={`row-upcoming-${item.month}`} onClick={() => navigate(monthPath(item.month))} className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
            <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-[#5c4d2c]">{capitalize(monthLabel(item.month))}</span><span className="text-[10px] text-[#8f7f5a]">{plural(item.count, 'item', 'itens')}</span></span>
            <span className="flex shrink-0 items-center gap-2"><span className="font-mono-data text-[14px] text-[#a36354]">{money(item.amount)}</span><ChevronRight size={16} className="text-[#a89670]"/></span>
          </button>)}
        </div>
      </section>}

      {loading ? <div className="mt-8 space-y-4 animate-pulse"><div className="h-36 rounded-[22px] bg-[#e9e3d7]"/><div className="h-36 rounded-[22px] bg-[#e9e3d7]"/></div>
      : history.isError || cardsQuery.isError ? <div className="mt-8 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir o histórico.</h3><button onClick={() => { void cardsQuery.refetch(); void history.refetch(); }} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Tentar novamente</button></div>
      : months.length ? <div className="mt-8 space-y-4">
        {months.map((item, index) => <button key={item.month} data-testid={`card-month-${item.month}`} onClick={() => navigate(monthPath(item.month))} className="enter lift block w-full rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-5 text-left transition hover:border-[#d3cbbb] sm:p-6" style={{ animationDelay: `${.1 + .04 * index}s` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]"><CalendarDays size={17}/></span><span className="min-w-0"><span className="block truncate font-display text-[22px] leading-tight text-[#234638]">{capitalize(monthLabel(item.month))}</span><span className="mt-1 block text-[10px] text-[#899186]">{plural(item.movementCount, 'compra', 'compras')}</span></span></div>
            <ChevronRight size={18} className="mt-2 shrink-0 text-[#8c9388]"/>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="min-w-0"><p className="text-[10px] text-[#7c877a]">Usado</p><p className="mt-1 font-mono-data text-[18px] text-[#a36354] [overflow-wrap:anywhere] sm:text-[20px]">{money(item.usedAmount)}</p></div>
            <div className="min-w-0 border-l border-[#e9e3d8] pl-3"><p className="text-[10px] text-[#7c877a]">Disponível</p><p className="mt-1 font-mono-data text-[18px] text-[#315944] [overflow-wrap:anywhere] sm:text-[20px]">{money(item.availableAmount)}</p></div>
          </div>
          <div className="mt-4 flex items-center gap-3"><div className="flex-1"><Progress value={item.percentUsed} tone={item.percentUsed > 85 ? 'peach' : 'green'}/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(item.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>
          <p className="mt-2 text-right text-[10px] text-[#8c9388]">limite de {money(item.limitAmount)}</p>
          {totalOf(item.month) && <p data-testid={`text-all-cards-${item.month}`} className="mt-3 border-t border-[#e9e3d8] pt-3 text-[10px] text-[#7c877a]"><b className="font-semibold text-[#42624d]">Todos os cartões:</b> usado <span className="font-mono-data text-[#a36354]">{money(totalOf(item.month)?.usedAmount)}</span> · disponível <span className="font-mono-data text-[#315944]">{money(totalOf(item.month)?.availableAmount)}</span></p>}
        </button>)}
      </div>
      : <div className="mt-8 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><History size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Nada por aqui ainda.</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#7d887c]">Seu histórico começa quando você cadastrar o cartão.</p></div>}
    </div>
  </main>;
}
