import { type FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetCardQueryKey, getGetCardsQueryKey, getGetConsolidatedHistoryQueryKey, getGetCategoriesQueryKey, getGetCategorySummaryQueryKey,
  getGetMovementsQueryKey, getGetMonthHistoryQueryKey, getHealthCheckQueryKey, useHealthCheck,
  useGetCards, useGetCategories, useGetCategorySummary, useGetMovements, useGetMonthStatus,
  useCreateCard, useUpdateCard, useDeleteCard, useSelectCard,
  useCreateMovement, useUpdateMovement, useDeleteMovement, useStartMonth,
  useCreatePurchase, useUpdatePurchase, useDeletePurchase, useGetLastFutureMonth, useGetMonthPreview,
  useCreateRecurring, useUpdateRecurring, useDeleteRecurring, useGetMonthHistory, useGetFutureInstallments,
  getGetLastFutureMonthQueryKey, getGetMonthPreviewQueryKey, getGetFutureInstallmentsQueryKey,
  type Cards, type Category, type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard,
  LayoutDashboard, MoreHorizontal, Plus, X,
} from 'lucide-react';
import { CardPicker, type CarouselCard } from '@/components/card-picker';
import { chargeDialog, chargeOfMovement, chargeOfPlanned, type RecurringCharge } from '@/lib/recurring-charge';
import { CardMenu } from '@/components/card-menu';
import { ChartLegend } from '@/components/charts/chart-legend';
import { Columns } from '@/components/charts/columns';
import { HBars } from '@/components/charts/hbars';
import { StepLine } from '@/components/charts/step-line';
import { invoiceColumns, paceSteps, topCategories } from '@/lib/card-series';
import { AppHeader } from '@/components/app-header';
import { ScopeDialog } from '@/components/scope-dialog';
import { FormActions, FormSheet, SheetHeader } from '@/components/bottom-sheet';
import { removeAsk, useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { dialogPanel } from '@/lib/dialog-styles';
import { useRememberMonth } from '@/lib/last-month';
import { CARD_COLOR_KEYS, CARD_COLORS, type CardColor } from '@/lib/card-colors';
import {
  capitalize, currentMonth, dateLabel, today, defaultDateFor, firstDayOf, isFutureMonth, lastDayOf,
  money, monthLabel, monthName, monthOf, plural, shiftMonth, type MonthKey,
} from '@/lib/format';

type DialogKind = 'card' | 'movement';
export type DialogRecord = {
  id?: number; categoryId?: number | null; name?: string; amount?: number; color?: CardColor; description?: string; date?: string;
  // Installment purchases: `amount` is the purchase total and `installment` the one in this month.
  isPurchase?: boolean; purchaseId?: number; installmentCount?: number; installment?: number; firstInstallment?: number;
  // Recurring purchases: `amount` is the monthly value; `scope` is what an edit applies to (RF-04).
  isRecurring?: boolean; recurringId?: number; lastMonth?: string | null; scope?: 'month' | 'forward';
};
// One line of the month's list: a registered purchase or a planned installment (future months).
type Row = {
  key: string; description: string; date: string; amount: number; categoryId: number | null; categoryName: string | null;
  installment?: number; installmentCount?: number; recurring?: boolean; movement?: Movement; planned?: PlannedInstallment;
};

// Same split as the data layer: the leftover cents go to installment 1.
function splitPreview(total: number, count: number, installment: number, date: string) {
  if (!(total > 0) || !Number.isInteger(count) || count < 2 || !Number.isInteger(installment) || installment < 1 || installment > count || !date) return null;
  const base = Math.floor(Math.round(total * 100) / count) / 100;
  const first = Math.round((total - base * (count - 1)) * 100) / 100;
  const last = shiftMonth(date.slice(0, 7), count - installment);
  return { base, first, lastLabel: `${monthName(last)}/${last.slice(0, 4)}` };
}

const filterKey = (categoryId: number | null) => (categoryId === null ? 'none' : String(categoryId));
const sortRows = (a: Row, b: Row) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key);

export function Dialog({ kind, initial, month, categories, busy, error, onClose, onSave, onDelete }: {
  kind: DialogKind; initial: DialogRecord; month: MonthKey; categories: Category[]; busy: boolean; error?: string | null;
  onClose: () => void; onSave: (values: DialogRecord) => void; onDelete?: () => void;
}) {
  const [name, setName] = useState(initial.name ?? '');
  const [amount, setAmount] = useState(String(initial.amount ?? ''));
  const [description, setDescription] = useState(initial.description ?? '');
  // D5: the date is free; a future month opens on its first day.
  const [date, setDate] = useState(initial.date?.slice(0, 10) ?? (isFutureMonth(month) ? firstDayOf(month) : defaultDateFor(month)));
  const [categoryId, setCategoryId] = useState(initial.categoryId ? String(initial.categoryId) : '');
  const [color, setColor] = useState<CardColor>(initial.color ?? 'verde');
  const [isPurchase, setIsPurchase] = useState(Boolean(initial.isPurchase));
  const [installmentCount, setInstallmentCount] = useState(String(initial.installmentCount ?? 2));
  const [installment, setInstallment] = useState(String(initial.installment ?? 1));
  const [firstInstallment, setFirstInstallment] = useState(String(initial.firstInstallment ?? 1));
  // D2: a recurring purchase repeats every month; it never shares the form with an installment purchase.
  const [isRecurring, setIsRecurring] = useState(Boolean(initial.isRecurring));
  const [lastMonth, setLastMonth] = useState<string>(initial.lastMonth ?? '');
  const isEdit = Boolean(initial.id);
  const editsPurchase = isEdit && Boolean(initial.purchaseId);
  const editsRecurring = isEdit && Boolean(initial.recurringId);
  const onlyThisMonth = initial.scope === 'month';
  const chargeMonth = (initial.date ?? date).slice(0, 7);
  const title = kind === 'card' ? (isEdit ? 'Ajustar cartão' : 'Seu cartão')
    : isRecurring ? (isEdit ? 'Editar compra recorrente' : 'Nova compra recorrente')
    : isPurchase ? (isEdit ? 'Editar compra parcelada' : 'Nova compra parcelada') : (isEdit ? 'Editar compra' : 'Nova compra');
  const split = isPurchase ? splitPreview(Number(amount), Number(installmentCount), Number(installment), date) : null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(kind === 'card' ? { name, color }
      : { description, amount: Number(amount), date, categoryId: categoryId ? Number(categoryId) : null, isPurchase, installmentCount: Number(installmentCount), installment: Number(installment), firstInstallment: editsPurchase ? Number(firstInstallment) : undefined, isRecurring, lastMonth: isRecurring && lastMonth ? lastMonth : null });
  };
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      <SheetHeader kicker={kind === 'card' ? 'Visão principal' : 'Registro confirmado'} title={title} onClose={onClose}/>
      {kind === 'movement' ? <>
        <label className="field-label">O que foi?</label><input data-testid="input-movement-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: mercado da semana" className="field-input mb-4"/>
        <label className="field-label">Categoria</label>
        <div className="relative mb-4"><select data-testid="select-movement-category" disabled={onlyThisMonth} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none disabled:opacity-60"><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 text-ink-mute" size={16}/></div>
        {(!isEdit || editsPurchase) && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
          <span id="purchase-switch-label" className="text-[13px] font-semibold text-ink">Compra parcelada</span>
          <button type="button" role="switch" data-testid="switch-installments" aria-checked={isPurchase} aria-labelledby="purchase-switch-label" disabled={isEdit} onClick={() => { setIsPurchase(!isPurchase); if (!isPurchase) setIsRecurring(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-70 ${isPurchase ? 'bg-brand' : 'bg-line-strong'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPurchase ? 'left-[22px]' : 'left-0.5'}`}/></button>
        </div>}
        {!isEdit && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
          <span id="recurring-switch-label" className="text-[13px] font-semibold text-ink">Compra recorrente</span>
          <button type="button" role="switch" data-testid="switch-recurring" aria-checked={isRecurring} aria-labelledby="recurring-switch-label" onClick={() => { setIsRecurring(!isRecurring); if (!isRecurring) setIsPurchase(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition ${isRecurring ? 'bg-brand' : 'bg-line-strong'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isRecurring ? 'left-[22px]' : 'left-0.5'}`}/></button>
        </div>}
      </> : <>
        <label className="field-label">Nome do cartão</label><input data-testid="input-card-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cartão principal" className="field-input mb-4"/>
      </>}
      {kind === 'movement' && <>
      <label className="field-label">{isPurchase ? 'Valor total da compra' : isRecurring ? 'Valor mensal' : 'Valor da compra'}</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span><input data-testid="input-movement-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      </>}
      {kind === 'movement' && isPurchase && <div className={`mb-4 grid gap-3 ${editsPurchase ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="min-w-0"><label htmlFor="input-installment-count" className="field-label">Nº de parcelas</label><input id="input-installment-count" data-testid="input-installment-count" required type="number" step="1" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} className="field-input"/></div>
        <div className="min-w-0"><label htmlFor="input-installment" className="field-label">Parcela neste mês</label><input id="input-installment" data-testid="input-installment" required type="number" step="1" value={installment} onChange={(e) => setInstallment(e.target.value)} className="field-input"/></div>
        {editsPurchase && <div className="min-w-0"><label htmlFor="input-first-installment" className="field-label">Começa na parcela</label><input id="input-first-installment" data-testid="input-first-installment" required type="number" step="1" value={firstInstallment} onChange={(e) => setFirstInstallment(e.target.value)} className="field-input"/></div>}
      </div>}
      {kind === 'movement' && <><label className="field-label">Data da compra</label><input data-testid="input-movement-date" required type="date" min={editsRecurring ? firstDayOf(chargeMonth) : undefined} max={editsRecurring ? lastDayOf(chargeMonth) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className={`field-input ${isPurchase || isRecurring ? 'mb-3' : 'mb-6'}`}/></>}
      {kind === 'movement' && isRecurring && <div className="mb-6 space-y-3">
        {!onlyThisMonth && <div><label htmlFor="input-recurring-last-month" className="field-label">Até (mês, opcional)</label><input id="input-recurring-last-month" data-testid="input-recurring-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/></div>}
        {date && <p data-testid="text-recurring-preview" className="text-[13px] text-ink-soft"><b className="font-semibold text-ink">Todo mês, dia {Number(date.slice(8, 10))}</b>, a partir de {monthLabel(date.slice(0, 7))} · {lastMonth && !onlyThisMonth ? `até ${monthLabel(lastMonth)}` : 'sem data final'}</p>}
        {editsRecurring && <p data-testid="text-recurring-warning" className="rounded-xl bg-alert-tint px-3 py-2 text-[13px] leading-5 text-alert">{onlyThisMonth ? `A mudança vale só para ${monthLabel(chargeMonth)}.` : 'As mudanças valem deste mês em diante.'}</p>}
      </div>}
      {kind === 'movement' && isPurchase && <div className="mb-6 space-y-2">
        {split && <p data-testid="text-installment-preview" className="text-[13px] text-ink-soft"><b className="font-semibold text-ink">{installmentCount}x de {money(split.base)}</b> · última em {split.lastLabel}{split.first !== split.base && <> · 1ª de {money(split.first)}</>}</p>}
        {editsPurchase && <p data-testid="text-purchase-warning" className="rounded-xl bg-alert-tint px-3 py-2 text-[13px] leading-5 text-alert">As mudanças valem para todas as parcelas.</p>}
      </div>}
      {kind === 'card' && <><span id="card-color-label" className="field-label">Cor do cartão</span><div role="group" aria-labelledby="card-color-label" className="mb-6 flex flex-wrap gap-2.5">{CARD_COLOR_KEYS.map((key) => <button key={key} type="button" data-testid={`button-card-color-${key}`} aria-label={CARD_COLORS[key].label} aria-pressed={color === key} onClick={() => setColor(key)} className={`grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-surface transition ${color === key ? 'ring-2 ring-ink' : 'hover:scale-105'}`} style={{ background: CARD_COLORS[key].background }}>{color === key && <Check size={15} className="text-white"/>}</button>)}</div></>}
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    {kind === 'movement' && isEdit && onDelete && <button type="button" data-testid="button-delete-movement" onClick={onDelete} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold text-alert transition hover:bg-alert-tint">Excluir compra</button>}
    </form>
  </FormSheet>;
}

export default function Dashboard({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const client = useQueryClient();
  const [, navigate] = useLocation();
  const isCurrentMonth = month === currentMonth();
  // D12: a future month opens until the last one with a planned installment or a purchase.
  const isFuture = isFutureMonth(month);
  const lastFutureMonth = useGetLastFutureMonth({ query: { queryKey: getGetLastFutureMonthQueryKey() } }).data ?? null;
  const canGoNext = month < currentMonth() || Boolean(lastFutureMonth && month < lastFutureMonth);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1 } });
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month), refetchOnWindowFocus: true } });
  const cards = (cardsQuery.data?.cards ?? []) as CarouselCard[];
  const selectedCardId = cardsQuery.data?.selectedCardId ?? null;
  const card = cards.find((item) => item.id === selectedCardId);
  // 0 matches no card, so the per-card queries come back empty when there is none.
  const cardId = card?.id ?? 0;
  const monthStatus = useGetMonthStatus(cardId).data;
  const categoriesQuery = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey(), refetchOnWindowFocus: true } });
  const categories = categoriesQuery.data ?? [];
  const movementsQuery = useGetMovements(cardId, month, { query: { queryKey: getGetMovementsQueryKey(cardId, month), enabled: Boolean(card), refetchOnWindowFocus: true } });
  const summaryQuery = useGetCategorySummary(cardId, month, { query: { queryKey: getGetCategorySummaryQueryKey(cardId, month), enabled: Boolean(card), refetchOnWindowFocus: true } });
  // RN-02: the charts read what the screen already fetches, plus the card's history and planned installments.
  const history = useGetMonthHistory(cardId, { query: { queryKey: getGetMonthHistoryQueryKey(cardId), enabled: Boolean(card), refetchOnWindowFocus: true } }).data ?? [];
  const futureInstallments = useGetFutureInstallments(cardId, { query: { queryKey: getGetFutureInstallmentsQueryKey(cardId), enabled: Boolean(card), refetchOnWindowFocus: true } }).data ?? [];
  const preview = useGetMonthPreview(cardId, month, { query: { queryKey: getGetMonthPreviewQueryKey(cardId, month), enabled: isFuture && Boolean(card), refetchOnWindowFocus: true } }).data;
  const summary = summaryQuery.data ?? [];
  const [filter, setFilter] = useState('all');
  const [dialog, setDialog] = useState<{ kind: DialogKind; initial: DialogRecord; onDelete?: () => void } | null>(null);
  const confirm = useConfirm();
  const { notice, notify, failed, formError } = useNotice(Boolean(dialog));
  const [showAll, setShowAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // RF-04 / RF-05: editing or deleting a charge of a recurring purchase asks for the scope first.
  const [scopeAsk, setScopeAsk] = useState<{ action: 'edit' | 'delete'; charge: RecurringCharge } | null>(null);

  // Prefix keys: refreshes every card and month, plus the history, the totals and the planned installments.
  const refresh = () => {
    for (const queryKey of [getGetCardsQueryKey(), getGetCardQueryKey(), getGetConsolidatedHistoryQueryKey(), getGetCategoriesQueryKey(), getGetCategorySummaryQueryKey(), getGetMovementsQueryKey(), getGetMonthHistoryQueryKey(), ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const mutationOptions = { onSuccess: () => { refresh(); setDialog(null); notify('Alterações salvas com cuidado.'); }, onError: failed };
  const createCard = useCreateCard({ mutation: mutationOptions });
  const updateCard = useUpdateCard({ mutation: mutationOptions });
  const deleteCard = useDeleteCard({ mutation: { onSuccess: (_result, vars) => { refresh(); notify(`Cartão “${cards.find((item) => item.id === vars.cardId)?.name ?? ''}” removido.`); }, onError: failed } });
  // The carousel switches at once; the choice is saved in the background.
  const selectCard = useSelectCard({ mutation: { onSuccess: () => refresh(), onError: (error) => { refresh(); failed(error); } } });
  const chooseCard = (id: number) => {
    client.setQueryData<Cards>(getGetCardsQueryKey(month), (data) => data && { ...data, selectedCardId: id });
    setFilter('all');
    selectCard.mutate({ cardId: id });
  };
  const createMovement = useCreateMovement({ mutation: { onSuccess: (movement) => { refresh(); setDialog(null); notify(monthOf(movement.date) === month ? 'Compra registrada.' : `Compra registrada em ${monthLabel(monthOf(movement.date))}.`); }, onError: failed } });
  const updateMovement = useUpdateMovement({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify('Compra atualizada.'); }, onError: failed } });
  const deleteMovement = useDeleteMovement({ mutation: { onSuccess: () => { refresh(); notify('Compra excluída.'); }, onError: failed } });
  const createPurchase = useCreatePurchase({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify('Compra parcelada registrada.'); }, onError: failed } });
  const updatePurchase = useUpdatePurchase({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify('Compra parcelada atualizada.'); }, onError: failed } });
  const deletePurchase = useDeletePurchase({ mutation: { onSuccess: () => { refresh(); notify('Compra parcelada removida.'); }, onError: failed } });
  const createRecurring = useCreateRecurring({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify('Compra recorrente registrada.'); }, onError: failed } });
  const updateRecurring = useUpdateRecurring({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify('Compra recorrente atualizada.'); }, onError: failed } });
  const deleteRecurring = useDeleteRecurring({ mutation: { onSuccess: () => { refresh(); notify('Compra recorrente removida.'); }, onError: failed } });
  const startMonth = useStartMonth({ mutation: { onSuccess: () => refresh(), onError: failed } });
  // RF-12: the new month starts by itself, with no question.
  useEffect(() => {
    if (card && isCurrentMonth && monthStatus?.needsStart && !startMonth.isPending) startMonth.mutate({ cardId: card.id, month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, isCurrentMonth, month, monthStatus?.needsStart]);
  const isMutating = createCard.isPending || updateCard.isPending || createMovement.isPending || updateMovement.isPending || createPurchase.isPending || updatePurchase.isPending || createRecurring.isPending || updateRecurring.isPending;

  const movements = movementsQuery.data ?? [];
  const rows: Row[] = [
    ...movements.map((movement): Row => ({ key: `m${movement.id}`, description: movement.description, date: movement.date, amount: movement.amount, categoryId: movement.categoryId, categoryName: movement.categoryName, installment: movement.installment, installmentCount: movement.purchase?.installmentCount ?? movement.installmentCount, recurring: movement.recurringId !== undefined, movement })),
    ...(isFuture ? (preview?.installments ?? []).map((planned): Row => ({ key: `p${planned.kind}${planned.purchaseId ?? planned.recurringId}-${planned.installment ?? 0}`, description: planned.description, date: planned.date, amount: planned.amount, categoryId: planned.categoryId, categoryName: planned.categoryName, installment: planned.installment, installmentCount: planned.installmentCount, recurring: planned.kind === 'recurring', planned })) : []),
  ].sort(sortRows);
  const chips = summary.map((item) => ({ key: filterKey(item.categoryId), label: item.name ?? 'Sem categoria' }));
  const activeFilter = chips.some((chip) => chip.key === filter) ? filter : 'all';
  const visibleRows = rows.filter((row) => activeFilter === 'all' || filterKey(row.categoryId) === activeFilter);
  const visibleTotal = Math.round(visibleRows.reduce((total, row) => total + row.amount, 0) * 100) / 100;
  const pace = paceSteps(rows.map((row) => ({ date: row.date, amount: row.amount, description: row.description })));
  const columns = invoiceColumns(month, history, futureInstallments);
  const nextInvoice = columns[1]?.amount ?? 0;
  const categoryRows = topCategories(summary.map((item) => ({ key: filterKey(item.categoryId), label: item.name ?? 'Sem categoria', amount: item.amount, percent: item.percent })));
  const daysInMonth = Number(lastDayOf(month).slice(8, 10));
  const todayDay = isCurrentMonth ? Number(today().slice(8, 10)) : null;
  // D7: tapping a category filters the purchases and scrolls to them; tapping it again clears the filter.
  const pickCategory = (key: string) => {
    setFilter(activeFilter === key ? 'all' : key);
    document.getElementById('compras')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const loading = cardsQuery.isLoading || movementsQuery.isLoading;

  const submitDialog = (values: DialogRecord) => {
    if (!dialog) return;
    if (dialog.kind === 'card') {
      const data = { name: values.name ?? '', color: values.color };
      if (dialog.initial.id) updateCard.mutate({ cardId: dialog.initial.id, data }); else createCard.mutate({ data });
      return;
    }
    const categoryId = values.categoryId ?? null;
    const date = values.date ?? defaultDateFor(month);
    if (values.isRecurring) {
      const data = { description: values.description ?? '', amount: Number(values.amount), date, lastMonth: values.lastMonth ?? null };
      if (dialog.initial.recurringId) updateRecurring.mutate({ recurringId: dialog.initial.recurringId, month: monthOf(dialog.initial.date ?? date), scope: dialog.initial.scope ?? 'forward', categoryId, data });
      else if (card) createRecurring.mutate({ cardId: card.id, categoryId, data });
      return;
    }
    if (values.isPurchase) {
      const data = { description: values.description ?? '', totalAmount: Number(values.amount), installmentCount: Number(values.installmentCount), installment: Number(values.installment), firstInstallment: values.firstInstallment, date };
      if (dialog.initial.purchaseId) updatePurchase.mutate({ purchaseId: dialog.initial.purchaseId, categoryId, data }); else if (card) createPurchase.mutate({ cardId: card.id, categoryId, data });
    } else {
      const data = { description: values.description ?? '', amount: Number(values.amount), date };
      if (dialog.initial.id) updateMovement.mutate({ movementId: dialog.initial.id, categoryId, data }); else if (card) createMovement.mutate({ cardId: card.id, categoryId, data });
    }
  };
  const askDelete = (label: string) => confirm(removeAsk(label));
  const editMovement = (movement: Movement) => movement.recurring ? setScopeAsk({ action: 'edit', charge: chargeOfMovement(movement)! }) : setDialog({
    kind: 'movement',
    onDelete: () => removeMovement(movement),
    initial: movement.purchase
      ? { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.purchase.totalAmount, date: movement.date, isPurchase: true, purchaseId: movement.purchase.id, installmentCount: movement.purchase.installmentCount, installment: movement.installment, firstInstallment: movement.purchase.firstInstallment }
      : { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date },
  });
  // A planned installment edits the whole purchase; a planned recurring charge asks for the scope first (compras-em-qualquer-mes RF-01).
  const editPlanned = (planned: PlannedInstallment) => {
    const charge = chargeOfPlanned(planned);
    if (charge) { setScopeAsk({ action: 'edit', charge }); return; }
    if (planned.purchase) setDialog({
      kind: 'movement',
      onDelete: () => removePlanned(planned),
      initial: { id: planned.purchase.id, categoryId: planned.categoryId, description: planned.description, amount: planned.purchase.totalAmount, date: planned.date, isPurchase: true, purchaseId: planned.purchase.id, installmentCount: planned.purchase.installmentCount, installment: planned.installment, firstInstallment: planned.purchase.firstInstallment },
    });
  };
  const removePlanned = async (planned: PlannedInstallment) => {
    const charge = chargeOfPlanned(planned);
    if (charge) setScopeAsk({ action: 'delete', charge });
    else if (planned.purchase && await askDelete(`a compra parcelada “${planned.description}” e todas as suas parcelas`)) deletePurchase.mutate({ purchaseId: planned.purchase.id });
  };
  const chooseScope = async (scope: 'month' | 'forward') => {
    if (!scopeAsk) return;
    const { action, charge } = scopeAsk;
    const chargeMonth = monthOf(charge.date);
    setScopeAsk(null);
    if (action === 'edit') {
      setDialog({ kind: 'movement', onDelete: () => setScopeAsk({ action: 'delete', charge }), initial: chargeDialog(charge, scope) });
      return;
    }
    const what = scope === 'month' ? `“${charge.description}” só em ${monthLabel(chargeMonth)}` : `“${charge.description}” de ${monthLabel(chargeMonth)} em diante`;
    if (await askDelete(what)) deleteRecurring.mutate({ recurringId: charge.recurringId, month: chargeMonth, scope });
  };
  const removeMovement = async (movement: Movement) => {
    if (movement.recurring) { setScopeAsk({ action: 'delete', charge: chargeOfMovement(movement)! }); return; }
    if (movement.purchase) { if (await askDelete(`a compra parcelada “${movement.description}” e todas as suas parcelas`)) deletePurchase.mutate({ purchaseId: movement.purchase.id }); }
    else if (await askDelete(`a compra “${movement.description}”`)) deleteMovement.mutate({ movementId: movement.id });
  };

  if (loading) return <main className="min-h-safe bg-paper p-5 sm:p-10"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-5 w-36 rounded bg-chip"/><div className="mt-8 h-12 w-64 rounded bg-chip"/><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="h-64 rounded-3xl bg-chip"/><div className="h-64 rounded-3xl bg-chip"/></div><div className="mt-6 h-72 rounded-3xl bg-chip"/></div></main>;
  if (cardsQuery.isError || movementsQuery.isError) return <main className="flex min-h-safe items-center justify-center bg-paper p-6"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-chip text-brand"><CircleHelp/></div><h1 className="mt-5 font-display text-3xl text-ink">Vamos tentar de novo?</h1><p className="mt-3 text-sm leading-6 text-ink-mute">Não conseguimos abrir seu caderno agora. Sua informação continua segura.</p><button onClick={() => { void cardsQuery.refetch(); void movementsQuery.refetch(); }} className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand">Tentar novamente</button></div></main>;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter hidden items-center justify-between border-b border-line pb-5 sm:flex">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[11px] text-ink-mute"><span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-alert' : 'bg-brand'}`}/>{health.isError ? 'Sincronização pausada' : 'Seu caderno está em dia'}</div>
      </header>
      <AppHeader area="cards" month={month} canGoNext={canGoNext}/>

      {isFuture && <p data-testid="text-preview-banner" className="enter mt-3 flex items-start gap-2 rounded-2xl border border-line bg-warn-tint px-4 py-3 text-[13px] leading-5 text-eyebrow"><CalendarDays size={14} className="mt-0.5 shrink-0"/><span><b className="font-semibold">{capitalize(monthName(month))} ainda não começou:</b> aparecem as parcelas e cobranças previstas e as compras já registradas.</span></p>}



      {!cards.length ? <section className="enter mt-6 rounded-2xl border border-line bg-surface p-6">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-tint text-brand"><CreditCard size={20}/></div>
        <h2 className="font-display text-[28px] leading-tight text-ink">Vamos anotar o seu cartão?</h2>
        <p className="mt-2 text-[15px] text-ink-soft">Lance as compras e veja quanto deu a fatura de cada mês.</p>
        <button data-testid="button-create-card" onClick={() => setDialog({ kind: 'card', initial: { color: cardsQuery.data?.nextColor } })} className="mt-5 flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={16}/> Cadastrar cartão</button>
      </section> : <>
      <section className="enter mt-5"><CardPicker cards={cards} selectedId={selectedCardId} onSelect={chooseCard} onAdd={() => setDialog({ kind: 'card', initial: { color: cardsQuery.data?.nextColor } })}/></section>

      {card && <section data-testid="section-invoice" aria-label="Fatura" className="enter mt-6" style={{ animationDelay: '.08s' }}>
        <p className="text-sm font-medium text-ink-soft">{isFuture ? 'Fatura prevista de' : 'Fatura de'} {monthLabel(month)}</p>
        <div className="flex items-start justify-between gap-3">
          <p data-testid="text-invoice" className="min-w-0 font-display text-[44px] leading-[1.1] tracking-[-.02em] text-ink [overflow-wrap:anywhere] min-[380px]:text-[52px]">{money(card.invoiceAmount)}</p>
          <button aria-label="Mais opções do cartão" data-testid="button-card-menu" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover"><MoreHorizontal size={22}/></button>
        </div>
        <p className="mt-1 text-[15px] text-ink-soft">{card.movementCount === 0 ? 'Nenhuma compra neste mês.' : plural(card.movementCount, 'compra', 'compras')}{nextInvoice > 0 && <> · próxima fatura prevista {money(nextInvoice)}</>}</p>
      </section>}

      {card && <section data-testid="section-pace" aria-label="Ritmo do mês" className="enter mt-8" style={{ animationDelay: '.1s' }}>
        <h2 className="font-display text-2xl text-ink">Ritmo do mês</h2>
        <p className="mb-3 text-sm text-ink-soft">Gasto acumulado no cartão, dia a dia</p>
        {pace.length ? <StepLine month={month} days={daysInMonth} points={pace} todayDay={todayDay} light={isFuture} endDay={todayDay ?? daysInMonth}/>
          : <p data-testid="text-pace-empty" className="py-4 text-[15px] text-ink-soft">Nenhuma compra neste mês.</p>}
      </section>}

      {card && <section data-testid="section-where" aria-label="Para onde foi" className="enter mt-8" style={{ animationDelay: '.12s' }}>
        <h2 className="font-display text-2xl text-ink">Para onde foi</h2>
        <p className="mb-3 text-sm text-ink-soft">Por categoria, no mês</p>
        {categoryRows.length ? <HBars rows={categoryRows} fill="bg-chart-violet" label="Gasto por categoria" activeKey={activeFilter} onSelect={pickCategory} testId="list-category-summary" rowTestId={(key) => `row-summary-${key}`}/>
          : <p className="py-4 text-[15px] text-ink-soft">O resumo por categoria aparece quando houver compras no mês.</p>}
      </section>}

      {card && <section data-testid="section-next" aria-label="Próximas faturas" className="enter mt-8" style={{ animationDelay: '.14s' }}>
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-display text-2xl text-ink">Próximas faturas</h2><p className="mb-3 text-sm text-ink-soft">Sete meses, a partir de {monthName(month)}</p></div>
          <button data-testid="button-history" aria-label={`Ver histórico de ${card.name}`} onClick={() => navigate('/historico')} className="flex min-h-11 shrink-0 items-center text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Histórico</button>
        </div>
        <Columns columns={columns} caption="Fatura do cartão por mês" ariaLabel={`Fatura do cartão nos próximos sete meses: ${columns.map((col) => `${capitalize(monthName(col.month))} ${money(col.amount)}`).join(', ')}`}/>
        <ChartLegend items={[{ label: 'Lançada', swatch: 'bg-chart-violet' }, { label: 'Prevista', swatch: 'bg-chart-violet/[.38]' }]}/>
      </section>}
      </>}

      <section id="compras" className="mt-8 scroll-mt-4">
        <div className="enter min-w-0" style={{ animationDelay: '.16s' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-eyebrow"><ArrowDownLeft size={16}/><p className="font-mono-data text-[12px] uppercase tracking-[.14em]">Compras</p></div>
            {card && <button data-testid="button-all-purchases" onClick={() => navigate('/compras')} className="flex min-h-11 items-center text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Todas as compras</button>}
          </div>
          <h2 className="font-display text-[28px] leading-tight text-ink">O que já aconteceu</h2>
          {chips.length > 0 && <div data-testid="filter-categories" role="group" aria-label="Filtrar por categoria" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
            {[{ key: 'all', label: 'Todas' }, ...chips].map((chip) => <button key={chip.key} data-testid={`filter-${chip.key}`} aria-pressed={activeFilter === chip.key} onClick={() => setFilter(chip.key)} className={`h-11 shrink-0 rounded-full border px-4 text-[14px] font-semibold transition ${activeFilter === chip.key ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-ink-soft hover:bg-hover'}`}>{chip.label}</button>)}
          </div>}
          {activeFilter !== 'all' && <p data-testid="text-filter-total" className="mt-3 text-[13px] text-ink-soft">Total do filtro: <b className="font-mono-data font-medium text-ink">{money(visibleTotal)}</b></p>}
          <div className="mt-4 border-y border-line">
            {visibleRows.length ? <div data-testid="list-movements" className="divide-y divide-line">
              {(showAll ? visibleRows : visibleRows.slice(0, 8)).map((row) => {
                // D3 / D4: a registered purchase or a planned installment opens its edit form; a planned recurring charge has no action.
                const open = row.movement ? () => editMovement(row.movement!) : row.planned ? () => editPlanned(row.planned!) : null;
                const content = <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-alert-tint text-alert"><ArrowUpRight size={18}/></span>
                  <span className="block min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-ink"><span className="truncate">{row.description}</span>{row.installment && <span data-testid={row.movement ? `badge-installment-${row.movement.id}` : undefined} className="shrink-0 rounded-full bg-chip px-2 py-0.5 font-mono-data text-[12px] font-medium text-ink-soft">{row.installment}/{row.installmentCount}</span>}{row.recurring && <span data-testid="badge-recurring" className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-[12px] font-semibold text-brand">Mensal</span>}{row.planned && <span className="shrink-0 rounded-full bg-warn-tint px-2 py-0.5 text-[12px] font-medium text-eyebrow">prevista</span>}</span>
                    <span className="mt-1 flex items-center gap-2 text-[13px] text-ink-soft"><span className="flex items-center gap-1"><CalendarDays size={14}/>{dateLabel(row.date)}</span>{row.categoryName && <span data-testid="text-movement-category" className="truncate rounded-full bg-tint px-2 py-0.5 text-[12px] font-medium text-brand">{row.categoryName}</span>}</span>
                  </span>
                  <span className="shrink-0 text-right font-mono-data text-[15px] font-medium text-ink">− {money(row.amount)}</span>
                </>;
                const testId = row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`;
                const rowClass = 'flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left';
                return open
                  ? <button type="button" key={row.key} data-testid={testId} aria-label={`Editar compra ${row.description}`} onClick={open} className={`${rowClass} transition hover:bg-paper`}>{content}</button>
                  : <div key={row.key} data-testid={testId} className={rowClass}>{content}</div>;
              })}
              {visibleRows.length > 8 && <button onClick={() => setShowAll(!showAll)} className="min-h-11 w-full py-3 text-[13px] font-semibold text-brand hover:bg-paper">{showAll ? 'Mostrar menos' : `Ver mais ${visibleRows.length - 8} compras`}</button>}
            </div> : <div className="px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-ink-mute"><ArrowDownLeft size={18}/></div><h3 data-testid="text-movements-empty" className="mt-3 font-display text-[20px] text-ink">Ainda sem compras</h3><p className="mt-1 text-[13px] leading-5 text-ink-soft">{card ? `As compras de ${monthName(month)} aparecem aqui assim que você registrar.` : 'Cadastre um cartão para começar a registrar suas compras.'}</p>{card && <button onClick={() => setDialog({ kind: 'movement', initial: {} })} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Registrar a primeira compra</button>}</div>}
          </div>
        </div>
      </section>
    </div>
    {menuOpen && card && <CardMenu title={card.name} editLabel="Editar cartão" deleteLabel="Excluir cartão" onClose={() => setMenuOpen(false)} onEdit={() => setDialog({ kind: 'card', initial: { id: card.id, name: card.name, color: card.color } })} onDelete={async () => { if (await askDelete(`o cartão “${card.name}” e todos os seus registros`)) deleteCard.mutate({ cardId: card.id }); }}/>}
    {dialog && <Dialog kind={dialog.kind} initial={dialog.initial} month={month} categories={categories} busy={isMutating} error={formError} onClose={() => setDialog(null)} onSave={submitDialog} onDelete={dialog.onDelete && (() => { const remove = dialog.onDelete!; setDialog(null); remove(); })}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.charge.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    <Notice notice={notice}/>
  </main>;
}
