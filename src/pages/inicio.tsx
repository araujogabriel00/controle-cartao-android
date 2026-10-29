import { useLocation } from 'wouter';
import {
  getGetBenefitsQueryKey, getGetCardsQueryKey, getGetIncomeRangeQueryKey, getGetMonthCashQueryKey,
  useGetBenefits, useGetCards, useGetIncomeRange, useGetMonthCash,
} from '@workspace/api-client-react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, CircleHelp, CreditCard, HandCoins, Plus, Utensils } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { openQuickAdd } from '@/components/quick-add';
import { CARD_COLORS } from '@/lib/card-colors';
import { type Area, areaPath, money, plural, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

// specs/redesign-v2-fundacao.md RF-04, RF-05: o Início só lê o que as áreas já leem (RN-01, RN-03) e cada bloco
// abre a área correspondente, no mês aberto. Sem nada cadastrado, mostra os 3 passos do primeiro uso.
const NBSP = ' ';
const signed = (value: number, kind: 'in' | 'out' | 'result') =>
  value > 0 ? `${kind === 'out' ? '−' : '+'}${NBSP}${money(value)}` : money(value);

const block = 'enter block w-full rounded-2xl border border-line bg-surface p-4 text-left transition hover:bg-hover';

export default function Inicio({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  useRememberMonth(month);
  const cashQuery = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } });
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month) } });
  const benefitsQuery = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month) } });
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const go = (area: Exclude<Area, 'home'>) => navigate(areaPath(area, month));

  const cash = cashQuery.data;
  const cards = cardsQuery.data?.cards ?? [];
  const benefits = benefitsQuery.data?.items ?? [];
  const failed = cashQuery.isError || cardsQuery.isError || benefitsQuery.isError;
  const loading = !cash || !cardsQuery.data || !benefitsQuery.data;
  const spent = (cash?.billsAmount ?? 0) + (cash?.dailyAmount ?? 0) + (cash?.cardsAmount ?? 0);
  const empty = Boolean(cash) && cards.length === 0 && benefits.length === 0 && (cash?.incomeAmount ?? 0) === 0 && spent === 0 && (cash?.previousAmount ?? 0) === 0;
  const negative = (cash?.balanceAmount ?? 0) < 0;
  const invoices = cards.filter((card) => card.invoiceAmount > 0).sort((a, b) => b.invoiceAmount - a.invoiceAmount);

  const steps = [
    { title: 'Cadastre um cartão', text: 'Para lançar as compras e ver a fatura.', action: () => go('cards') },
    { title: 'Registre uma entrada', text: 'Salário, renda extra ou qualquer dinheiro que entrou.', action: () => openQuickAdd('income') },
    { title: 'Veja o saldo', text: 'O Início mostra quanto sobra no mês.', action: null },
  ];

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppHeader area="home" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>

      {failed ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-xl text-ink">Não deu para carregar o Início</h2><p className="mt-1 text-[14px] text-ink-soft">Seus dados continuam salvos. Tente de novo.</p><button onClick={() => { void cashQuery.refetch(); void cardsQuery.refetch(); void benefitsQuery.refetch(); }} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : loading || !cash ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[148px] animate-pulse rounded-2xl bg-line"/><div className="h-[84px] animate-pulse rounded-2xl bg-line"/><div className="h-[96px] animate-pulse rounded-2xl bg-line"/></div>
        : empty ? <section data-testid="section-first-use" aria-label="Primeiros passos" className="enter mt-6">
          <h1 className="font-display text-[28px] leading-tight text-ink">Lance sua primeira entrada</h1>
          <p className="mt-1 text-[15px] text-ink-soft">Em três passos o app já mostra para onde vai o seu dinheiro.</p>
          <button data-testid="button-first-income" onClick={() => openQuickAdd('income')} className="mt-4 flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/>Lançar entrada</button>
          <ol className="mt-6 space-y-2">
            {steps.map((step, index) => {
              const body = <><span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint font-display text-[18px] text-brand">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{step.title}</span><span className="block text-[14px] text-ink-soft">{step.text}</span></span>{step.action && <ChevronRight size={18} className="shrink-0 text-ink-soft"/>}</>;
              return <li key={step.title}>{step.action
                ? <button data-testid={`step-${index + 1}`} onClick={step.action} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:bg-hover">{body}</button>
                : <div data-testid={`step-${index + 1}`} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">{body}</div>}</li>;
            })}
          </ol>
        </section>
        : <div className="mt-6 space-y-3">
          {/* RF-04: saldo com o anterior e o resultado; abre Entradas. */}
          <button data-testid="card-home-balance" onClick={() => go('income')} aria-label={`Saldo do mês: ${money(cash.balanceAmount)}. Abrir Entradas`} className={block}>
            <span className="text-sm font-medium text-ink-soft">Saldo</span>
            <span data-testid="text-home-balance" className={`block font-display text-[40px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] min-[380px]:text-[48px] ${negative ? 'text-alert' : 'text-ink'}`}>{money(cash.balanceAmount)}</span>
            {negative && <span className="mt-1 block text-[14px] text-alert">As saídas passaram das entradas e do saldo anterior.</span>}
            <span className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[14px]">
              <span><span className="block text-ink-soft">Saldo anterior</span><span className="font-semibold text-ink">{money(cash.previousAmount)}</span></span>
              <span><span className="block text-ink-soft">Resultado do mês</span><span className="font-semibold text-ink">{signed(cash.resultAmount, 'result')}</span></span>
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button data-testid="card-home-in" onClick={() => go('income')} className={block} style={{ animationDelay: '.04s' }}>
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft"><ArrowDownLeft size={16} className="text-chart-in"/>Entrou</span>
              <span className="mt-1 block text-[18px] font-semibold text-ink [overflow-wrap:anywhere]">{signed(cash.incomeAmount, 'in')}</span>
            </button>
            <button data-testid="card-home-out" onClick={() => go('income')} className={block} style={{ animationDelay: '.06s' }}>
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft"><ArrowUpRight size={16} className="text-chart-out"/>Saiu</span>
              <span className="mt-1 block text-[18px] font-semibold text-ink [overflow-wrap:anywhere]">{signed(spent, 'out')}</span>
            </button>
          </div>

          {/* RF-04: próxima fatura — a maior do mês; abre Cartões. */}
          <button data-testid="card-home-invoice" onClick={() => go('cards')} className={block} style={{ animationDelay: '.08s' }}>
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft"><CreditCard size={16}/>Próxima fatura</span>
            {invoices.length === 0
              ? <span className="mt-1 block text-[15px] text-ink-soft">Nenhuma fatura neste mês.</span>
              : <>
                <span className="mt-1 block font-display text-[28px] leading-tight text-ink [overflow-wrap:anywhere]">{money(invoices[0].invoiceAmount)}</span>
                <span className="mt-0.5 flex items-center gap-2 text-[14px] text-ink-soft"><span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: CARD_COLORS[invoices[0].color].background }}/>{invoices[0].name}</span>
                {invoices.length > 1 && <span className="mt-1 block text-[14px] text-ink-soft">e mais {plural(invoices.length - 1, 'cartão', 'cartões')} com fatura no mês</span>}
              </>}
          </button>

          {/* RF-04: saldo disponível de cada benefício; abre Benefícios. */}
          <button data-testid="card-home-benefits" onClick={() => go('benefits')} className={block} style={{ animationDelay: '.1s' }}>
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft"><Utensils size={16}/>Benefícios</span>
            {benefits.length === 0
              ? <span className="mt-1 block text-[15px] text-ink-soft">Nenhum benefício cadastrado.</span>
              : <span className="mt-2 block divide-y divide-line">{benefits.map((item) => <span key={item.id} data-testid={`row-home-benefit-${item.id}`} className="flex items-center justify-between gap-3 py-2 text-[15px]"><span className="min-w-0 truncate text-ink">{item.name}</span><span className="shrink-0 font-semibold text-ink">{money(item.availableAmount)}</span></span>)}</span>}
          </button>

          <nav aria-label="Atalhos" className="grid grid-cols-3 gap-2 pt-1">
            {([['income', 'Entradas', HandCoins], ['cards', 'Cartões', CreditCard], ['benefits', 'Benefícios', Utensils]] as const).map(([area, label, Icon]) => <button key={area} data-testid={`shortcut-${area}`} onClick={() => go(area)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2 text-[14px] font-semibold text-brand transition hover:bg-hover"><Icon size={16}/>{label}</button>)}
          </nav>
        </div>}
    </div>
  </main>;
}
