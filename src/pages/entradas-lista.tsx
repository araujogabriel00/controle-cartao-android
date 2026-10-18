import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBillsQueryKey, getGetCategoriesQueryKey, getGetDailyExpensesQueryKey, getGetIncomeRangeQueryKey, getGetIncomesQueryKey, getGetMonthCashQueryKey,
  getGetCardsQueryKey, useDeleteBill, useDeleteDailyExpense, useDeleteIncome, useGetBills, useGetCards, useGetCategories, useGetDailyExpenses, useGetIncomes,
  useSelectCard, useUpdateBill, useUpdateDailyExpense, useUpdateIncome,
  type BillOccurrence, type DailyExpense, type IncomeOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import { ArrowLeft, CalendarDays, Check, ChevronRight, CircleHelp, CreditCard, HandCoins, Pencil, Receipt, Repeat, ShoppingBasket, Trash2 } from 'lucide-react';
import { BillDialog, DailyDialog, IncomeDialog, KIND_LABELS, type BillForm, type BillValues, type DailyValues, type IncomeForm } from '@/components/entry-dialogs';
import { Progress } from '@/components/progress';
import { ScopeDialog } from '@/components/scope-dialog';
import { CARD_COLORS } from '@/lib/card-colors';
import { areaPath, capitalize, dateLabel, money, monthLabel, type ListKind, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const rowIcon = 'grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]';
const emptyBox = (testid: string, icon: React.ReactNode, text: string) => <div className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]">{icon}</div><p data-testid={testid} className="mt-3 text-xs text-[#7d887c]">{text}</p></div>;

type ScopeAsk = { kind: 'income'; action: 'edit' | 'delete'; item: IncomeOccurrence } | { kind: 'bill'; action: 'edit' | 'delete'; item: BillOccurrence };

const TITLES: Record<ListKind, { kicker: string; title: string }> = {
  'entradas': { kicker: 'Dinheiro que entra', title: 'Entradas' },
  'contas-fixas': { kicker: 'Se repetem todo mês', title: 'Contas fixas' },
  'gastos': { kicker: 'Avulsos', title: 'Gastos do dia a dia' },
  'cartoes': { kicker: 'Faturas do mês', title: 'Cartões' },
};

// One screen per summary block of the Entradas tab (specs/telas-de-entradas.md): the list of the
// month with edit and delete. Creating is only through the footer "+" (D5).
export default function EntradasLista({ kind, month }: { kind: ListKind; month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const incomes = useGetIncomes(month, { query: { queryKey: getGetIncomesQueryKey(month), enabled: kind === 'entradas', refetchOnWindowFocus: true } });
  const bills = useGetBills(month, { query: { queryKey: getGetBillsQueryKey(month), enabled: kind === 'contas-fixas', refetchOnWindowFocus: true } });
  const daily = useGetDailyExpenses(month, { query: { queryKey: getGetDailyExpensesQueryKey(month), enabled: kind === 'gastos', refetchOnWindowFocus: true } });
  const cards = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month), enabled: kind === 'cartoes', refetchOnWindowFocus: true } });
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [incomeForm, setIncomeForm] = useState<IncomeForm | null>(null);
  const [billForm, setBillForm] = useState<BillForm | null>(null);
  const [dailyForm, setDailyForm] = useState<{ item?: DailyExpense } | null>(null);
  const [scopeAsk, setScopeAsk] = useState<ScopeAsk | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const incomeItems = incomes.data?.items ?? [];
  const billItems = bills.data?.items ?? [];
  const dailyItems = daily.data?.items ?? [];

  const refresh = () => {
    for (const queryKey of [getGetIncomesQueryKey(), getGetIncomeRangeQueryKey(), getGetBillsQueryKey(), getGetDailyExpensesQueryKey(), getGetMonthCashQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['benefits']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const closing = (text: string) => ({ onSuccess: () => { refresh(); setIncomeForm(null); setBillForm(null); setDailyForm(null); notify(text); }, onError: failed });
  const done = (text: string) => ({ onSuccess: () => { refresh(); notify(text); }, onError: failed });
  // D11: a card row opens the Cartões tab, in this month, with that card selected.
  const selectCard = useSelectCard({ mutation: { onSuccess: () => { refresh(); navigate(areaPath('cards', month)); }, onError: failed } });
  const updateIncome = useUpdateIncome({ mutation: closing('Entrada atualizada.') });
  const deleteIncome = useDeleteIncome({ mutation: done('Entrada removida.') });
  const updateBill = useUpdateBill({ mutation: closing('Conta fixa atualizada.') });
  const deleteBill = useDeleteBill({ mutation: done('Conta fixa removida.') });
  const updateDaily = useUpdateDailyExpense({ mutation: closing('Gasto atualizado.') });
  const deleteDaily = useDeleteDailyExpense({ mutation: done('Gasto excluído.') });

  const incomeLabel = (item: IncomeOccurrence) => item.description || KIND_LABELS[item.kind];
  const scopeText = (name: string, scope: IncomeScope) => (scope === 'month' ? `“${name}” só em ${monthLabel(month)}` : `“${name}” de ${monthLabel(month)} em diante`);
  const confirmDeleteIncome = (item: IncomeOccurrence, scope: IncomeScope) => {
    const what = item.recurring ? scopeText(incomeLabel(item), scope) : `“${incomeLabel(item)}”`;
    if (window.confirm(`Remover ${what}? Esta ação não pode ser desfeita.`)) deleteIncome.mutate({ incomeId: item.incomeId, month, scope });
  };
  const confirmDeleteBill = (item: BillOccurrence, scope: IncomeScope) => {
    if (window.confirm(`Remover ${scopeText(item.name, scope)}? Esta ação não pode ser desfeita.`)) deleteBill.mutate({ billId: item.billId, month, scope });
  };
  const chooseScope = (scope: IncomeScope) => {
    if (!scopeAsk) return;
    const ask = scopeAsk;
    setScopeAsk(null);
    if (ask.kind === 'income') { if (ask.action === 'edit') setIncomeForm({ item: ask.item, scope }); else confirmDeleteIncome(ask.item, scope); }
    else if (ask.action === 'edit') setBillForm({ item: ask.item, scope });
    else confirmDeleteBill(ask.item, scope);
  };
  const saveIncome: Parameters<typeof IncomeDialog>[0]['onSave'] = (values) => {
    if (incomeForm?.item) updateIncome.mutate({ incomeId: incomeForm.item.incomeId, month, scope: incomeForm.scope ?? 'forward', data: values });
  };
  const saveBill = (values: BillValues) => {
    if (billForm?.item) updateBill.mutate({ billId: billForm.item.billId, month, scope: billForm.scope ?? 'forward', data: values });
  };
  const saveDaily = (values: DailyValues) => {
    const data = { description: values.description, amount: values.amount, date: values.date };
    if (dailyForm?.item) updateDaily.mutate({ expenseId: dailyForm.item.id, categoryId: values.categoryId, data });
  };

  const cardItems = cards.data?.cards ?? [];
  const query = kind === 'entradas' ? incomes : kind === 'contas-fixas' ? bills : kind === 'cartoes' ? cards : daily;
  const total = kind === 'entradas' ? incomes.data?.totalAmount : kind === 'contas-fixas' ? bills.data?.totalAmount : kind === 'cartoes' ? Math.round(cardItems.reduce((sum, card) => sum + card.invoiceAmount, 0) * 100) / 100 : daily.data?.totalAmount;
  const busy = updateIncome.isPending || updateBill.isPending || updateDaily.isPending;
  const { kicker, title } = TITLES[kind];
  const iconButtons = (testid: string, label: string, onEdit: () => void, onDelete: () => void) => <div className="flex shrink-0 items-center">
    <button data-testid={`button-edit-${testid}`} aria-label={`Editar ${label}`} onClick={onEdit} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><Pencil size={15}/></button>
    <button data-testid={`button-delete-${testid}`} aria-label={`Excluir ${label}`} onClick={onDelete} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
  </div>;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-end border-b border-[#ded8ca] pb-5">
        <button data-testid="button-back" onClick={() => navigate(areaPath('income', month))} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><ArrowLeft size={14}/> Voltar</button>
      </header>

      <section className="enter mt-8 flex items-end justify-between gap-3" style={{ animationDelay: '.06s' }}>
        <div className="min-w-0">
          <p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#ac8f60]">{kicker} · {capitalize(monthLabel(month))}</p>
          <h1 data-testid="text-list-title" className="mt-2 font-display text-[34px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[42px]">{title}</h1>
        </div>
        <p data-testid="text-list-total" className="shrink-0 font-mono-data text-[18px] text-[#315944]">{money(total)}</p>
      </section>

      {query.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-[#e9e3d7]"/><div className="h-16 rounded-2xl bg-[#e9e3d7]"/></div>
      : query.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir esta lista.</h3></div>
      : <>
      {kind === 'entradas' && (incomeItems.length ? <ul data-testid="list-incomes" className="mt-6 space-y-3">
        {incomeItems.map((item) => <li key={item.incomeId} data-testid={`row-income-${item.incomeId}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
          <span className={rowIcon}><HandCoins size={17}/></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-[#2f4a3b]">{incomeLabel(item)}</span>{item.recurring && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span>}</p>
            <p className="mt-0.5 text-[10px] text-[#899186]">{item.description ? `${KIND_LABELS[item.kind]} · ` : ''}{dateLabel(item.date)}</p>
          </div>
          <span className="shrink-0 font-mono-data text-[15px] text-[#315944]">{money(item.amount)}</span>
          {iconButtons(`income-${item.incomeId}`, incomeLabel(item), () => (item.recurring ? setScopeAsk({ kind: 'income', action: 'edit', item }) : setIncomeForm({ item })), () => (item.recurring ? setScopeAsk({ kind: 'income', action: 'delete', item }) : confirmDeleteIncome(item, 'forward')))}
        </li>)}
      </ul> : emptyBox('text-income-empty', <HandCoins size={16}/>, 'Nenhuma entrada neste mês.'))}

      {kind === 'contas-fixas' && (billItems.length ? <ul data-testid="list-bills" className="mt-6 space-y-3">
        {billItems.map((item) => <li key={item.billId} data-testid={`row-bill-${item.billId}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
          <span className={rowIcon}><Receipt size={17}/></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-[#2f4a3b]">{item.name}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span></p>
            <p className="mt-0.5 text-[10px] text-[#899186]">dia {Number(item.date.slice(8))}</p>
          </div>
          <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">{money(item.amount)}</span>
          {iconButtons(`bill-${item.billId}`, item.name, () => setScopeAsk({ kind: 'bill', action: 'edit', item }), () => setScopeAsk({ kind: 'bill', action: 'delete', item }))}
        </li>)}
      </ul> : emptyBox('text-bills-empty', <Receipt size={16}/>, 'Nenhuma conta fixa neste mês.'))}

      {kind === 'cartoes' && (cardItems.length ? <ul data-testid="list-cards" className="mt-6 space-y-3">
        {cardItems.map((card) => <li key={card.id}><button data-testid={`row-card-${card.id}`} onClick={() => selectCard.mutate({ cardId: card.id })} className="flex w-full items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4 text-left transition hover:bg-[#f4f0e6]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-white" style={{ background: CARD_COLORS[card.color].background }}><CreditCard size={17}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#2f4a3b]">{card.name}</span><span className="mt-0.5 block text-[10px] text-[#899186]">{plural(card.movementCount, 'compra', 'compras')}</span></span>
          <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">{money(card.invoiceAmount)}</span>
          <ChevronRight size={16} className="shrink-0 text-[#9aa497]"/>
        </button></li>)}
      </ul> : emptyBox('text-cards-empty', <CreditCard size={16}/>, 'Nenhum cartão cadastrado.'))}

      {kind === 'gastos' && <>
        {dailyItems.length ? <ul data-testid="list-daily" className="mt-6 space-y-3">
          {dailyItems.map((item) => <li key={item.id} data-testid={`row-daily-${item.id}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
            <span className={rowIcon}><ShoppingBasket size={17}/></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#2f4a3b]">{item.description}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[10px] text-[#899186]"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateLabel(item.date)}</span>{item.categoryName && <span className="truncate rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-medium text-[#52735c]">{item.categoryName}</span>}</p>
            </div>
            <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">− {money(item.amount)}</span>
            {iconButtons(`daily-${item.id}`, item.description, () => setDailyForm({ item }), () => { if (window.confirm(`Remover o gasto “${item.description}”? Esta ação não pode ser desfeita.`)) deleteDaily.mutate({ expenseId: item.id }); })}
          </li>)}
        </ul> : emptyBox('text-daily-empty', <ShoppingBasket size={16}/>, 'Nenhum gasto neste mês.')}
        {(daily.data?.summary.length ?? 0) > 0 && <div className="mt-5 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-5">
          <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Por categoria · {plural(dailyItems.length, 'gasto', 'gastos')}</p>
          <ul data-testid="list-daily-summary" className="mt-4 space-y-4">{daily.data?.summary.map((row) => <li key={row.categoryId ?? 'none'} data-testid={`row-daily-summary-${row.categoryId ?? 'none'}`}>
            <div className="flex items-baseline justify-between gap-3"><span className="truncate text-[13px] font-semibold text-[#345443]">{row.name ?? 'Sem categoria'}</span><span className="shrink-0 font-mono-data text-[13px] text-[#a36354]">{money(row.amount)}</span></div>
            <div className="mt-2 flex items-center gap-3"><div className="flex-1"><Progress value={row.percent} tone="green"/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(row.percent).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>
          </li>)}</ul>
        </div>}
      </>}
      </>}
    </div>

    {incomeForm && <IncomeDialog key={`${incomeForm.item?.incomeId ?? 'new'}-${incomeForm.scope ?? ''}`} month={month} item={incomeForm.item} scope={incomeForm.scope} busy={busy} onClose={() => setIncomeForm(null)} onSave={saveIncome}/>}
    {billForm && <BillDialog key={`${billForm.item?.billId ?? 'new'}-${billForm.scope ?? ''}`} month={month} item={billForm.item} scope={billForm.scope} busy={busy} onClose={() => setBillForm(null)} onSave={saveBill}/>}
    {dailyForm && <DailyDialog key={dailyForm.item?.id ?? 'new'} month={month} item={dailyForm.item} categories={categories} busy={busy} onClose={() => setDailyForm(null)} onSave={saveDaily}/>}
    {scopeAsk && <ScopeDialog subject={scopeAsk.kind === 'income' ? 'entrada' : 'conta fixa'} action={scopeAsk.action} month={month} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14}/>{toast.text}</div>}
  </main>;
}
