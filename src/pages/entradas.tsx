import { type FormEvent, type MouseEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  INCOME_KINDS, getGetBillsQueryKey, getGetCategoriesQueryKey, getGetDailyExpensesQueryKey, getGetIncomeRangeQueryKey, getGetIncomesQueryKey, getGetMonthCashQueryKey,
  useCreateBill, useCreateCategory, useCreateDailyExpense, useCreateIncome, useDeleteBill, useDeleteCategory, useDeleteDailyExpense, useDeleteIncome,
  useGetBills, useGetCategories, useGetDailyExpenses, useGetIncomeRange, useGetIncomes, useGetMonthCash, useUpdateBill, useUpdateCategory, useUpdateDailyExpense, useUpdateIncome,
  type BillOccurrence, type Category, type DailyExpense, type IncomeKind, type IncomeOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import {
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, HandCoins, Pencil, Plus, Receipt, Repeat, ShoppingBasket, Tag, Trash2, X,
} from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { CategoriesDialog } from '@/components/categories-dialog';
import { ScopeDialog } from '@/components/scope-dialog';
import { Progress } from '@/components/progress';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { capitalize, currentMonth, dateLabel, firstDayOf, lastDayOf, money, monthLabel, shiftMonth, today, type MonthKey } from '@/lib/format';

const KIND_LABELS: Record<IncomeKind, string> = { salario: 'Salário', prolabore: 'Pró-labore', bonus: 'Bônus', outro: 'Outro' };

export const incomePath = (month: MonthKey) => (month === currentMonth() ? '/entradas' : `/entradas/mes/${month}`);

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const backdrop = (onClose: () => void) => (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };

// Scrolls (instead of clipping) when the keyboard shrinks the viewport.
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return <div className={dialogOverlay} onMouseDown={backdrop(onClose)}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={backdrop(onClose)}>
      <div className="flex min-h-full p-4" onMouseDown={backdrop(onClose)}>{children}</div>
    </div>
  </div>;
}

const cancelButton = (onClose: () => void) => <button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button>;
const submitButton = (busy: boolean, isEdit: boolean) => <button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button>;
const dialogHeader = (kicker: string, title: string, onClose: () => void) => <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">{kicker}</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{title}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>;

// "Só este mês" edits/deletes apply to a recurring item's single month; the
// form is never opened for a one-off income with a scope (income D7).
type IncomeForm = { item?: IncomeOccurrence; scope?: IncomeScope };

function IncomeDialog({ month, item, scope, busy, onClose, onSave }: {
  month: MonthKey; item?: IncomeOccurrence; scope?: IncomeScope; busy: boolean;
  onClose: () => void;
  onSave: (values: { kind: IncomeKind; description: string; amount: number; date: string; recurring: boolean; lastMonth: MonthKey | null }) => void;
}) {
  const isEdit = Boolean(item);
  // RN-05: editing one month of a recurring income never changes its type or repetition.
  const onlyThisMonth = scope === 'month';
  // The date of a recurring occurrence stays inside its month; anything else is free.
  const insideMonth = Boolean(item?.recurring);
  const [kind, setKind] = useState<IncomeKind>(item?.kind ?? 'salario');
  const [description, setDescription] = useState(item?.description ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [date, setDate] = useState(item?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const [recurring, setRecurring] = useState(item?.recurring ?? false);
  const [lastMonth, setLastMonth] = useState(item?.lastMonth ?? '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ kind, description, amount: Number(amount), date, recurring, lastMonth: recurring && lastMonth ? lastMonth : null });
  };
  return <Modal onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Dinheiro que entra', isEdit ? 'Editar entrada' : 'Nova entrada', onClose)}
      <label htmlFor="select-income-kind" className="field-label">Tipo</label>
      <div className="relative mb-4"><select id="select-income-kind" data-testid="select-income-kind" required disabled={onlyThisMonth} value={kind} onChange={(e) => setKind(e.target.value as IncomeKind)} className="field-input appearance-none disabled:opacity-60">{INCOME_KINDS.map((key) => <option key={key} value={key}>{KIND_LABELS[key]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-[#768579]" size={16}/></div>
      <label htmlFor="input-income-description" className="field-label">Descrição (opcional)</label>
      <input id="input-income-description" data-testid="input-income-description" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: empresa X" className="field-input mb-4"/>
      <label htmlFor="input-income-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input id="input-income-amount" data-testid="input-income-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-income-date" className="field-label">Data</label>
      <input id="input-income-date" data-testid="input-income-date" required type="date" min={insideMonth ? firstDayOf(month) : undefined} max={insideMonth ? lastDayOf(month) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-4"/>
      {!onlyThisMonth && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e6dfd1] bg-[#f4f0e6] px-4 py-3">
        <span id="income-recurring-label" className="text-[13px] font-semibold text-[#3d5948]">Repetir todo mês</span>
        <button type="button" role="switch" data-testid="switch-income-recurring" aria-checked={recurring} aria-labelledby="income-recurring-label" onClick={() => setRecurring(!recurring)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${recurring ? 'bg-[#28513f]' : 'bg-[#cfc8b9]'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${recurring ? 'left-[22px]' : 'left-0.5'}`}/></button>
      </div>}
      {!onlyThisMonth && recurring && <div className="mb-4"><label htmlFor="input-income-last-month" className="field-label">Até (mês, opcional)</label><input id="input-income-last-month" data-testid="input-income-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/><p className="mt-1.5 text-[10px] text-[#8c9388]">Deixe em branco para repetir sem data final.</p></div>}
      {onlyThisMonth && <p className="mb-4 rounded-xl bg-[#f5e9e1] px-3 py-2 text-[11px] leading-5 text-[#8c5a4c]">A mudança vale só para {monthLabel(month)}.</p>}
      <div className="mt-2 flex gap-3">{cancelButton(onClose)}{submitButton(busy, isEdit)}</div>
    </form>
  </Modal>;
}

type BillForm = { item?: BillOccurrence; scope?: IncomeScope };
type BillValues = { name: string; amount: number; date: string; lastMonth: MonthKey | null };

// RF-05: a fixed bill always repeats, so the form has no repeat switch (D2).
function BillDialog({ month, item, scope, busy, onClose, onSave }: {
  month: MonthKey; item?: BillOccurrence; scope?: IncomeScope; busy: boolean; onClose: () => void; onSave: (values: BillValues) => void;
}) {
  const isEdit = Boolean(item);
  const onlyThisMonth = scope === 'month';
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [date, setDate] = useState(item?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const [lastMonth, setLastMonth] = useState<string>(item?.lastMonth ?? '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ name, amount: Number(amount), date, lastMonth: lastMonth || null });
  };
  return <Modal onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Se repete todo mês', isEdit ? 'Editar conta fixa' : 'Nova conta fixa', onClose)}
      <label htmlFor="input-bill-name" className="field-label">Nome</label>
      <input id="input-bill-name" data-testid="input-bill-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: aluguel" className="field-input mb-4"/>
      <label htmlFor="input-bill-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input id="input-bill-amount" data-testid="input-bill-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-bill-date" className="field-label">Data</label>
      <input id="input-bill-date" data-testid="input-bill-date" required type="date" min={isEdit ? firstDayOf(month) : undefined} max={isEdit ? lastDayOf(month) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input"/>
      {!isEdit && <p className="mb-4 mt-1.5 text-[10px] text-[#8c9388]">O dia e o mês inicial da conta saem desta data.</p>}
      {isEdit && <div className="mb-4"/>}
      {!onlyThisMonth && <div className="mb-4"><label htmlFor="input-bill-last-month" className="field-label">Até (mês, opcional)</label><input id="input-bill-last-month" data-testid="input-bill-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/><p className="mt-1.5 text-[10px] text-[#8c9388]">Deixe em branco para repetir sem data final.</p></div>}
      {onlyThisMonth && <p className="mb-4 rounded-xl bg-[#f5e9e1] px-3 py-2 text-[11px] leading-5 text-[#8c5a4c]">A mudança vale só para {monthLabel(month)}.</p>}
      <div className="mt-2 flex gap-3">{cancelButton(onClose)}{submitButton(busy, isEdit)}</div>
    </form>
  </Modal>;
}

type DailyValues = { description: string; amount: number; date: string; categoryId: number | null };

// RF-07: the date is free up to a year ahead (D8); the category is optional.
function DailyDialog({ month, item, categories, busy, onClose, onSave }: {
  month: MonthKey; item?: DailyExpense; categories: Category[]; busy: boolean; onClose: () => void; onSave: (values: DailyValues) => void;
}) {
  const isEdit = Boolean(item);
  const [description, setDescription] = useState(item?.description ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [categoryId, setCategoryId] = useState(item?.categoryId ? String(item.categoryId) : '');
  const [date, setDate] = useState(item?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ description, amount: Number(amount), date, categoryId: categoryId ? Number(categoryId) : null });
  };
  return <Modal onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Gasto do dia a dia', isEdit ? 'Editar gasto' : 'Novo gasto', onClose)}
      <label htmlFor="input-daily-description" className="field-label">O que foi?</label>
      <input id="input-daily-description" data-testid="input-daily-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: feira" className="field-input mb-4"/>
      <label htmlFor="select-daily-category" className="field-label">Categoria</label>
      <div className="relative mb-4"><select id="select-daily-category" data-testid="select-daily-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-[#768579]" size={16}/></div>
      <label htmlFor="input-daily-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input id="input-daily-amount" data-testid="input-daily-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-daily-date" className="field-label">Data</label>
      <input id="input-daily-date" data-testid="input-daily-date" required type="date" max={lastDayOf(shiftMonth(currentMonth(), 12))} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-6"/>
      <div className="flex gap-3">{cancelButton(onClose)}{submitButton(busy, isEdit)}</div>
    </form>
  </Modal>;
}

type ScopeAsk = { kind: 'income'; action: 'edit' | 'delete'; item: IncomeOccurrence } | { kind: 'bill'; action: 'edit' | 'delete'; item: BillOccurrence };

const rowIcon = 'grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]';
const sectionTitle = (icon: React.ReactNode, kicker: string, title: string, total: string, testid: string) => <div className="flex items-end justify-between gap-3">
  <div><div className="flex items-center gap-2 text-[#ac8f60]">{icon}<p className="font-mono-data text-[10px] uppercase tracking-[.2em]">{kicker}</p></div><h2 className="mt-2 font-display text-[26px] text-[#234638]">{title}</h2></div>
  <p data-testid={testid} className="shrink-0 font-mono-data text-[16px] text-[#315944]">{total}</p>
</div>;
const emptyBox = (testid: string, icon: React.ReactNode, text: string) => <div className="mt-4 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]">{icon}</div><h3 data-testid={testid} className="mt-3 font-display text-[18px] text-[#345443]">{text}</h3></div>;

export default function Entradas({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const incomes = useGetIncomes(month, { query: { queryKey: getGetIncomesQueryKey(month), refetchOnWindowFocus: true } });
  const bills = useGetBills(month, { query: { queryKey: getGetBillsQueryKey(month), refetchOnWindowFocus: true } });
  const daily = useGetDailyExpenses(month, { query: { queryKey: getGetDailyExpensesQueryKey(month), refetchOnWindowFocus: true } });
  const cash = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } }).data;
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [incomeForm, setIncomeForm] = useState<IncomeForm | null>(null);
  const [billForm, setBillForm] = useState<BillForm | null>(null);
  const [dailyForm, setDailyForm] = useState<{ item?: DailyExpense } | null>(null);
  const [scopeAsk, setScopeAsk] = useState<ScopeAsk | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const incomeItems = incomes.data?.items ?? [];
  const billItems = bills.data?.items ?? [];
  const dailyItems = daily.data?.items ?? [];

  // Categories are shared with the cards and the benefits, so their lists refresh together.
  const refresh = () => {
    for (const queryKey of [getGetIncomesQueryKey(), getGetIncomeRangeQueryKey(), getGetBillsQueryKey(), getGetDailyExpensesQueryKey(), getGetMonthCashQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['benefits']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const closing = (text: string) => ({ onSuccess: () => { refresh(); setIncomeForm(null); setBillForm(null); setDailyForm(null); notify(text); }, onError: failed });
  const done = (text: string) => ({ onSuccess: () => { refresh(); notify(text); }, onError: failed });
  const createIncome = useCreateIncome({ mutation: closing('Entrada registrada.') });
  const updateIncome = useUpdateIncome({ mutation: closing('Entrada atualizada.') });
  const deleteIncome = useDeleteIncome({ mutation: done('Entrada removida.') });
  const createBill = useCreateBill({ mutation: closing('Conta fixa registrada.') });
  const updateBill = useUpdateBill({ mutation: closing('Conta fixa atualizada.') });
  const deleteBill = useDeleteBill({ mutation: done('Conta fixa removida.') });
  const createDaily = useCreateDailyExpense({ mutation: { onSuccess: (expense) => { refresh(); setDailyForm(null); notify(expense.date.slice(0, 7) === month ? 'Gasto registrado.' : `Gasto registrado em ${monthLabel(expense.date.slice(0, 7))}.`); }, onError: failed } });
  const updateDaily = useUpdateDailyExpense({ mutation: closing('Gasto atualizado.') });
  const deleteDaily = useDeleteDailyExpense({ mutation: done('Gasto excluído.') });
  const createCategory = useCreateCategory({ mutation: done('Categoria criada.') });
  const updateCategory = useUpdateCategory({ mutation: done('Categoria renomeada.') });
  const deleteCategory = useDeleteCategory({ mutation: done('Categoria removida.') });

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
    else createIncome.mutate({ data: values });
  };
  const saveBill = (values: BillValues) => {
    if (billForm?.item) updateBill.mutate({ billId: billForm.item.billId, month, scope: billForm.scope ?? 'forward', data: values });
    else createBill.mutate({ data: values });
  };
  const saveDaily = (values: DailyValues) => {
    const data = { description: values.description, amount: values.amount, date: values.date };
    if (dailyForm?.item) updateDaily.mutate({ expenseId: dailyForm.item.id, categoryId: values.categoryId, data });
    else createDaily.mutate({ categoryId: values.categoryId, data });
  };
  const removeCategory = (category: Category) => {
    const effect = category.movementCount ? ` ${category.movementCount === 1 ? '1 compra ficará sem categoria.' : `${category.movementCount} compras ficarão sem categoria.`}` : '';
    if (window.confirm(`Excluir a categoria “${category.name}”?${effect} Esta ação não pode ser desfeita.`)) deleteCategory.mutate({ categoryId: category.id });
  };

  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const isCurrentMonth = month === currentMonth();
  const negative = (cash?.balanceAmount ?? 0) < 0;
  const busy = createIncome.isPending || updateIncome.isPending || createBill.isPending || updateBill.isPending || createDaily.isPending || updateDaily.isPending;
  const loading = incomes.isLoading || bills.isLoading || daily.isLoading;
  const failedLoad = incomes.isError || bills.isError || daily.isError;
  const iconButtons = (testid: string, label: string, onEdit: () => void, onDelete: () => void) => <div className="flex shrink-0 items-center">
    <button data-testid={`button-edit-${testid}`} aria-label={`Editar ${label}`} onClick={onEdit} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><Pencil size={15}/></button>
    <button data-testid={`button-delete-${testid}`} aria-label={`Excluir ${label}`} onClick={onDelete} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
  </div>;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppTabs/>

      <nav aria-label="Mês" className="enter mt-4 flex items-center justify-between gap-2 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1.5">
        <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(incomePath(shiftMonth(month, -1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft size={17}/></button>
        <div className="min-w-0 text-center"><p data-testid="text-month" className="truncate font-display text-[17px] text-[#234638]">{capitalize(monthLabel(month))}</p>{!isCurrentMonth && <button data-testid="button-current-month" onClick={() => navigate('/entradas')} className="text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Voltar para o mês atual</button>}</div>
        <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(incomePath(shiftMonth(month, 1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={17}/></button>
      </nav>

      <section className="enter mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end" style={{ animationDelay: '.06s' }}>
        <div><p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#9a8d71]">O que entra e o que sai</p><h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[54px]">Suas <em className="font-medium text-[#d78470]">entradas.</em></h1></div>
        <button data-testid="button-categories" onClick={() => setShowCategories(true)} className="flex w-fit items-center gap-1.5 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-4 py-3 text-xs font-semibold text-[#496754] transition hover:bg-[#eee9dd]"><Tag size={14}/> Categorias</button>
      </section>

      <section data-testid="section-cash" aria-label="Resumo do mês" className="enter mt-6 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-4 sm:p-5" style={{ animationDelay: '.08s' }}>
        <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Resumo do mês · {capitalize(monthLabel(month))}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {([['Entradas', cash?.incomeAmount, 'income', 'text-[#315944]'], ['Contas fixas', cash?.billsAmount, 'bills', 'text-[#a55f50]'], ['Gastos do dia a dia', cash?.dailyAmount, 'daily', 'text-[#a55f50]'], ['Cartões', cash?.cardsAmount, 'cards', 'text-[#a55f50]']] as const).map(([label, value, id, tone]) =>
            <div key={id} className="min-w-0 rounded-2xl bg-[#f2eee4] p-3"><span className="text-[10px] text-[#7c877a]">{label}</span><p data-testid={`text-cash-${id}`} className={`mt-1 font-mono-data text-[13px] [overflow-wrap:anywhere] sm:text-[15px] ${tone}`}>{money(value)}</p>{id === 'cards' && <button data-testid="link-cards" onClick={() => navigate('/')} className="mt-1 text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Ver cartões</button>}</div>)}
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

      {loading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-[#e9e3d7]"/><div className="h-16 rounded-2xl bg-[#e9e3d7]"/></div>
      : failedLoad ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir este mês.</h3><button onClick={() => { void incomes.refetch(); void bills.refetch(); void daily.refetch(); }} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Tentar novamente</button></div>
      : <>
      <section data-testid="section-incomes" className="enter mt-8" style={{ animationDelay: '.1s' }}>
        {sectionTitle(<HandCoins size={14}/>, 'Dinheiro que entra', 'Entradas', money(incomes.data?.totalAmount), 'text-income-total')}
        <button data-testid="button-new-income" onClick={() => setIncomeForm({})} className="mt-3 flex items-center gap-2 rounded-full bg-[#28513f] px-4 py-2.5 text-[12px] font-semibold text-[#fffaf0] transition hover:bg-[#1f4333]"><Plus size={14}/> Nova entrada</button>
        {incomeItems.length ? <ul data-testid="list-incomes" className="mt-4 space-y-3">
          {incomeItems.map((item) => <li key={item.incomeId} data-testid={`row-income-${item.incomeId}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
            <span className={rowIcon}><HandCoins size={17}/></span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-[#2f4a3b]">{incomeLabel(item)}</span>{item.recurring && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span>}</p>
              <p className="mt-0.5 text-[10px] text-[#899186]">{item.description ? `${KIND_LABELS[item.kind]} · ` : ''}{dateLabel(item.date)}</p>
            </div>
            <span className="shrink-0 font-mono-data text-[15px] text-[#315944]">{money(item.amount)}</span>
            {iconButtons(`income-${item.incomeId}`, incomeLabel(item), () => (item.recurring ? setScopeAsk({ kind: 'income', action: 'edit', item }) : setIncomeForm({ item })), () => (item.recurring ? setScopeAsk({ kind: 'income', action: 'delete', item }) : confirmDeleteIncome(item, 'forward')))}
          </li>)}
        </ul> : emptyBox('text-income-empty', <HandCoins size={16}/>, 'Nenhuma entrada neste mês.')}
      </section>

      <section data-testid="section-bills" className="enter mt-10" style={{ animationDelay: '.12s' }}>
        {sectionTitle(<Receipt size={14}/>, 'Se repetem todo mês', 'Contas fixas', money(bills.data?.totalAmount), 'text-bills-total')}
        <button data-testid="button-new-bill" onClick={() => setBillForm({})} className="mt-3 flex items-center gap-2 rounded-full bg-[#28513f] px-4 py-2.5 text-[12px] font-semibold text-[#fffaf0] transition hover:bg-[#1f4333]"><Plus size={14}/> Nova conta fixa</button>
        {billItems.length ? <ul data-testid="list-bills" className="mt-4 space-y-3">
          {billItems.map((item) => <li key={item.billId} data-testid={`row-bill-${item.billId}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
            <span className={rowIcon}><Receipt size={17}/></span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-[#2f4a3b]">{item.name}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span></p>
              <p className="mt-0.5 text-[10px] text-[#899186]">dia {Number(item.date.slice(8))}</p>
            </div>
            <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">{money(item.amount)}</span>
            {iconButtons(`bill-${item.billId}`, item.name, () => setScopeAsk({ kind: 'bill', action: 'edit', item }), () => setScopeAsk({ kind: 'bill', action: 'delete', item }))}
          </li>)}
        </ul> : emptyBox('text-bills-empty', <Receipt size={16}/>, 'Nenhuma conta fixa neste mês.')}
      </section>

      <section data-testid="section-daily" className="enter mt-10" style={{ animationDelay: '.14s' }}>
        {sectionTitle(<ShoppingBasket size={14}/>, 'Avulsos', 'Gastos do dia a dia', money(daily.data?.totalAmount), 'text-daily-total')}
        <button data-testid="button-new-daily" onClick={() => setDailyForm({})} className="mt-3 flex items-center gap-2 rounded-full bg-[#28513f] px-4 py-2.5 text-[12px] font-semibold text-[#fffaf0] transition hover:bg-[#1f4333]"><Plus size={14}/> Novo gasto</button>
        {dailyItems.length ? <ul data-testid="list-daily" className="mt-4 space-y-3">
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
      </section>
      </>}
    </div>

    {incomeForm && <IncomeDialog key={`${incomeForm.item?.incomeId ?? 'new'}-${incomeForm.scope ?? ''}`} month={month} item={incomeForm.item} scope={incomeForm.scope} busy={busy} onClose={() => setIncomeForm(null)} onSave={saveIncome}/>}
    {billForm && <BillDialog key={`${billForm.item?.billId ?? 'new'}-${billForm.scope ?? ''}`} month={month} item={billForm.item} scope={billForm.scope} busy={busy} onClose={() => setBillForm(null)} onSave={saveBill}/>}
    {dailyForm && <DailyDialog key={dailyForm.item?.id ?? 'new'} month={month} item={dailyForm.item} categories={categories} busy={busy} onClose={() => setDailyForm(null)} onSave={saveDaily}/>}
    {scopeAsk && <ScopeDialog subject={scopeAsk.kind === 'income' ? 'entrada' : 'conta fixa'} action={scopeAsk.action} month={month} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    {showCategories && <CategoriesDialog categories={categories} busy={createCategory.isPending || updateCategory.isPending} onClose={() => setShowCategories(false)} onCreate={(name) => createCategory.mutate({ data: { name } })} onRename={(id, name) => updateCategory.mutate({ categoryId: id, data: { name } })} onDelete={removeCategory}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
