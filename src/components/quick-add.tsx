import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitsQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey,
  useCreateBenefitSpend, useCreateBill, useCreateDailyExpense, useCreateIncome, useCreateMovement, useCreatePurchase, useCreateRecurring,
  useGetBenefits, useGetCards, useGetCart, useGetCategories,
  type BenefitItem,
} from '@workspace/api-client-react';
import { CreditCard, HandCoins, Plus, Receipt, ShoppingBasket, Utensils } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { BottomSheet } from '@/components/bottom-sheet';
import { Notice, useNotice } from '@/components/notice';
import { hasFooter } from '@/lib/footer';
import { areaOf, defaultDateFor, monthInPath, monthLabel, monthOf, type MonthKey } from '@/lib/format';
import { BillDialog, DailyDialog, IncomeDialog } from '@/components/entry-dialogs';
import { Dialog as PurchaseDialog } from '@/pages/dashboard';
import { SpendDialog } from '@/pages/beneficios';

type Kind = 'income' | 'bill' | 'daily' | 'purchase' | 'spend';

// Event the screens fire to open a form of the "Lançar" menu without going through it
// (the Início's "Lançar entrada", specs/redesign-v2-fundacao.md RF-05).
export const QUICK_ADD_EVENT = 'quick-add';
export const openQuickAdd = (kind: Kind) => window.dispatchEvent(new CustomEvent<Kind>(QUICK_ADD_EVENT, { detail: kind }));

// Bottom bar plus the floating "Lançar" button (specs/botao-lancar.md, redesign-v2-fundacao.md D4): any entry can be
// registered from any area. It opens the forms the areas already have, in the open month, and stays on the same screen.
export function FooterMenu() {
  const [location] = useLocation();
  if (!hasFooter(location)) return null;
  return <FooterBar month={monthInPath(location)} location={location}/>;
}

function FooterBar({ month, location }: { month: MonthKey; location: string }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const [sheet, setSheet] = useState(false);
  // Carrinho D3: com a barra do carrinho no Início, o botão Lançar sobe para não ficar sobre ela.
  const cartCount = useGetCart().data?.productCount ?? 0;
  const cartBar = areaOf(location) === 'home' && cartCount > 0;
  const [form, setForm] = useState<Kind | null>(null);
  const [pickBenefit, setPickBenefit] = useState(false);
  const [benefit, setBenefit] = useState<BenefitItem | null>(null);
  const { notice, notify, failed, formError } = useNotice(form !== null);
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month) } });
  const benefits = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month) } }).data?.items ?? [];
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const cardId = cardsQuery.data?.selectedCardId ?? null;

  // Whatever an area shows may change, so everything is refreshed.
  const refresh = () => { void client.invalidateQueries(); };
  const closeAll = () => { setForm(null); setBenefit(null); setPickBenefit(false); };
  const saved = (text: string) => ({ onSuccess: () => { refresh(); closeAll(); notify(text); }, onError: failed });
  const createIncome = useCreateIncome({ mutation: saved('Entrada registrada.') });
  const createBill = useCreateBill({ mutation: saved('Conta fixa registrada.') });
  const createDaily = useCreateDailyExpense({ mutation: saved('Gasto registrado.') });
  const createMovement = useCreateMovement({ mutation: { onSuccess: (movement) => { refresh(); closeAll(); notify(monthOf(movement.date) === month ? 'Compra registrada.' : `Compra registrada em ${monthLabel(monthOf(movement.date))}.`); }, onError: failed } });
  const createPurchase = useCreatePurchase({ mutation: saved('Compra parcelada registrada.') });
  const createRecurring = useCreateRecurring({ mutation: saved('Compra recorrente registrada.') });
  const createSpend = useCreateBenefitSpend({ mutation: saved('Gasto registrado.') });
  const busy = [createIncome, createBill, createDaily, createMovement, createPurchase, createRecurring, createSpend].some((m) => m.isPending);

  const open = (kind: Kind) => {
    setSheet(false);
    if (kind === 'spend') { if (benefits.length === 1) setBenefit(benefits[0]); else setPickBenefit(true); }
    setForm(kind);
  };

  useEffect(() => {
    const onOpen = (event: Event) => open((event as CustomEvent<Kind>).detail);
    window.addEventListener(QUICK_ADD_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_ADD_EVENT, onOpen);
  });

  const options: { kind: Kind; label: string; icon: typeof Plus; disabled?: string }[] = [
    { kind: 'income', label: 'Entrada', icon: HandCoins },
    { kind: 'bill', label: 'Conta fixa', icon: Receipt },
    { kind: 'daily', label: 'Gasto do dia a dia', icon: ShoppingBasket },
    { kind: 'purchase', label: 'Compra no cartão', icon: CreditCard, disabled: cardId === null ? 'Cadastre um cartão primeiro' : undefined },
    { kind: 'spend', label: 'Gasto de benefício', icon: Utensils, disabled: benefits.length === 0 ? 'Cadastre um benefício primeiro' : undefined },
  ];

  return <>
    {/* Keeps the end of the page clear of the bar and of the button above it (botao-lancar D10). */}
    <div aria-hidden className="h-36"/>
    <AppTabs/>
    {/* previsoes D14: na área Previsões o botão faz o que a área é. */}
    {areaOf(location) === 'forecasts'
      ? <button data-testid="button-new-forecast" onClick={() => navigate('/previsoes/nova')} className="fixed right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand shadow-[0_8px_18px_-10px_rgba(0,0,0,.7)] transition hover:bg-brand-hover bottom-[calc(88px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]"><Plus size={22} strokeWidth={2.2}/>Nova previsão</button>
      : <button data-testid="button-quick-add" onClick={() => setSheet(true)} className={`fixed right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand shadow-[0_8px_18px_-10px_rgba(0,0,0,.7)] transition hover:bg-brand-hover ${cartBar ? 'bottom-[calc(160px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]' : 'bottom-[calc(88px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]'}`}><Plus size={22} strokeWidth={2.2}/>Lançar</button>}

    {sheet && <BottomSheet title="Lançar" onClose={() => setSheet(false)}>
      <div className="space-y-2">
        {options.map(({ kind, label, icon: Icon, disabled }) => <button key={kind} data-testid={`quick-${kind}`} disabled={Boolean(disabled)} onClick={() => open(kind)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left transition hover:bg-hover disabled:opacity-50 disabled:hover:bg-paper">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Icon size={18}/></span>
          <span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{label}</span>{disabled && <span className="block text-[13px] text-ink-soft">{disabled}</span>}</span>
        </button>)}
      </div>
    </BottomSheet>}

    {form === 'income' && <IncomeDialog month={month} busy={busy} error={formError} onClose={closeAll} onSave={(values) => createIncome.mutate({ data: values })}/>}
    {form === 'bill' && <BillDialog month={month} busy={busy} error={formError} onClose={closeAll} onSave={(values) => createBill.mutate({ data: values })}/>}
    {form === 'daily' && <DailyDialog month={month} categories={categories} busy={busy} error={formError} onClose={closeAll} onSave={(values) => createDaily.mutate({ categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}
    {form === 'purchase' && cardId !== null && <PurchaseDialog kind="movement" initial={{}} month={month} categories={categories} busy={busy} error={formError} onClose={closeAll} onSave={(values) => {
      const categoryId = values.categoryId ?? null;
      const date = values.date ?? defaultDateFor(month);
      if (values.isRecurring) createRecurring.mutate({ cardId, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date, lastMonth: values.lastMonth ?? null } });
      else if (values.isPurchase) createPurchase.mutate({ cardId, categoryId, data: { description: values.description ?? '', totalAmount: Number(values.amount), installmentCount: Number(values.installmentCount), installment: Number(values.installment), firstInstallment: values.firstInstallment, date } });
      else createMovement.mutate({ cardId, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date } });
    }}/>}
    {form === 'spend' && pickBenefit && !benefit && <BottomSheet title="Qual benefício?" onClose={closeAll}>
      <div className="space-y-2">{benefits.map((item) => <button key={item.id} data-testid={`quick-benefit-${item.id}`} onClick={() => setBenefit(item)} className="flex min-h-14 w-full items-center rounded-2xl border border-line bg-paper px-4 py-3 text-left text-[15px] font-semibold text-ink transition hover:bg-hover">{item.name}</button>)}</div>
    </BottomSheet>}
    {form === 'spend' && benefit && <SpendDialog month={month} benefit={benefit} categories={categories} busy={busy} error={formError} onClose={closeAll} onSave={(values) => createSpend.mutate({ benefitId: benefit.id, categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}

    <Notice notice={notice}/>
  </>;
}
