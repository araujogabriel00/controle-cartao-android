import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitsQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey,
  useCreateBenefitSpend, useCreateBill, useCreateDailyExpense, useCreateIncome, useCreateMovement, useCreatePurchase, useCreateRecurring,
  useGetBenefits, useGetCards, useGetCategories,
  type BenefitItem,
} from '@workspace/api-client-react';
import { CreditCard, HandCoins, Plus, Receipt, ShoppingBasket, Tag, Utensils, X } from 'lucide-react';
import { dialogOverlay } from '@/lib/dialog-styles';
import { defaultDateFor, monthInPath, monthLabel, monthOf, type MonthKey } from '@/lib/format';
import { BillDialog, DailyDialog, IncomeDialog } from '@/components/entry-dialogs';
import { Dialog as PurchaseDialog } from '@/pages/dashboard';
import { SpendDialog } from '@/pages/beneficios';

type Kind = 'income' | 'bill' | 'daily' | 'purchase' | 'spend';

// Areas that have the footer (D9): Entradas, Cartões and Benefícios, never the history or the categories.
const hasFooter = (location: string) => location === '/' || location.startsWith('/mes/') || location.startsWith('/entradas') || location.startsWith('/beneficios');

// Footer menu with the "Lançar" button (specs/botao-lancar.md): any entry can be registered from any
// area. It opens the forms the areas already have, in the open month, and stays on the same screen.
export function FooterMenu() {
  const [location] = useLocation();
  if (!hasFooter(location)) return null;
  return <FooterBar month={monthInPath(location)}/>;
}

function FooterBar({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState<Kind | null>(null);
  const [pickBenefit, setPickBenefit] = useState(false);
  const [benefit, setBenefit] = useState<BenefitItem | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month) } });
  const benefits = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month) } }).data?.items ?? [];
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const cardId = cardsQuery.data?.selectedCardId ?? null;

  // Whatever an area shows may change, so everything is refreshed.
  const refresh = () => { void client.invalidateQueries(); };
  const notify = (text: string, error = false) => { setToast({ text, error }); window.setTimeout(() => setToast(null), error ? 4200 : 3200); };
  const failed = (error?: Error) => notify(error?.message || 'Não foi possível salvar. Tente novamente.', true);
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

  const options: { kind: Kind; label: string; icon: typeof Plus; disabled?: string }[] = [
    { kind: 'income', label: 'Entrada', icon: HandCoins },
    { kind: 'bill', label: 'Conta fixa', icon: Receipt },
    { kind: 'daily', label: 'Gasto do dia a dia', icon: ShoppingBasket },
    { kind: 'purchase', label: 'Compra no cartão', icon: CreditCard, disabled: cardId === null ? 'Cadastre um cartão primeiro' : undefined },
    { kind: 'spend', label: 'Gasto de benefício', icon: Utensils, disabled: benefits.length === 0 ? 'Cadastre um benefício primeiro' : undefined },
  ];

  return <>
    {/* Keeps the end of the page clear of the fixed bar (D10). */}
    <div aria-hidden className="h-20"/>
    <nav aria-label="Menu de lançamentos" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e1dbce] bg-[#fbf8f0]/95 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto grid h-16 max-w-[860px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <div/>
        <button data-testid="button-quick-add" aria-label="Lançar" onClick={() => setSheet(true)} className="grid h-12 w-12 place-items-center rounded-full bg-[#28513f] text-[#fffaf0] shadow-[0_8px_18px_-10px_rgba(38,80,61,.7)] transition hover:bg-[#1f4333]"><Plus size={22}/></button>
        <div className="pl-3"><button data-testid="button-categories" aria-label="Categorias" onClick={() => navigate('/categorias')} className="grid h-11 w-11 place-items-center rounded-full border border-[#d9d2c4] bg-[#faf7ef] text-[#496754] transition hover:bg-[#eee9dd]"><Tag size={18}/></button></div>
      </div>
    </nav>

    {sheet && <div className={`${dialogOverlay} flex items-end`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSheet(false); }}>
      <div role="dialog" aria-label="Lançar" className="enter mx-auto w-full max-w-[440px] rounded-t-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-5 pb-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[22px] text-[#234638]">Lançar</h2><button aria-label="Fechar" onClick={() => setSheet(false)} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
        <div className="space-y-2">
          {options.map(({ kind, label, icon: Icon, disabled }) => <button key={kind} data-testid={`quick-${kind}`} disabled={Boolean(disabled)} onClick={() => open(kind)} className="flex w-full items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#f8f5ed] px-4 py-3.5 text-left transition hover:bg-[#eee9dd] disabled:opacity-50 disabled:hover:bg-[#f8f5ed]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e4ece2] text-[#52735c]"><Icon size={17}/></span>
            <span className="min-w-0"><span className="block text-[14px] font-semibold text-[#234638]">{label}</span>{disabled && <span className="block text-[11px] text-[#8c9388]">{disabled}</span>}</span>
          </button>)}
        </div>
      </div>
    </div>}

    {form === 'income' && <IncomeDialog month={month} busy={busy} onClose={closeAll} onSave={(values) => createIncome.mutate({ data: values })}/>}
    {form === 'bill' && <BillDialog month={month} busy={busy} onClose={closeAll} onSave={(values) => createBill.mutate({ data: values })}/>}
    {form === 'daily' && <DailyDialog month={month} categories={categories} busy={busy} onClose={closeAll} onSave={(values) => createDaily.mutate({ categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}
    {form === 'purchase' && cardId !== null && <PurchaseDialog kind="movement" initial={{}} month={month} categories={categories} busy={busy} onClose={closeAll} onSave={(values) => {
      const categoryId = values.categoryId ?? null;
      const date = values.date ?? defaultDateFor(month);
      if (values.isRecurring) createRecurring.mutate({ cardId, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date, lastMonth: values.lastMonth ?? null } });
      else if (values.isPurchase) createPurchase.mutate({ cardId, categoryId, data: { description: values.description ?? '', totalAmount: Number(values.amount), installmentCount: Number(values.installmentCount), installment: Number(values.installment), firstInstallment: values.firstInstallment, date } });
      else createMovement.mutate({ cardId, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date } });
    }}/>}
    {form === 'spend' && pickBenefit && !benefit && <div className={`${dialogOverlay} flex items-end`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeAll(); }}>
      <div role="dialog" aria-label="Qual benefício?" className="enter mx-auto w-full max-w-[440px] rounded-t-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-5 pb-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[22px] text-[#234638]">Qual benefício?</h2><button aria-label="Fechar" onClick={closeAll} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
        <div className="space-y-2">{benefits.map((item) => <button key={item.id} data-testid={`quick-benefit-${item.id}`} onClick={() => setBenefit(item)} className="flex w-full items-center rounded-2xl border border-[#e1dbce] bg-[#f8f5ed] px-4 py-3.5 text-left text-[14px] font-semibold text-[#234638] transition hover:bg-[#eee9dd]">{item.name}</button>)}</div>
      </div>
    </div>}
    {form === 'spend' && benefit && <SpendDialog month={month} benefit={benefit} categories={categories} busy={busy} onClose={closeAll} onSave={(values) => createSpend.mutate({ benefitId: benefit.id, categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}

    {toast && <div role="status" data-testid="status-toast" className={`fixed left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}>{toast.text}</div>}
  </>;
}
