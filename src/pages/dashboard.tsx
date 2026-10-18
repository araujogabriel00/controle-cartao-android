import { type FormEvent, type MouseEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetCardQueryKey, getGetCardsQueryKey, getGetConsolidatedHistoryQueryKey, getGetCategoriesQueryKey, getGetCategorySummaryQueryKey,
  getGetMovementsQueryKey, getGetMonthHistoryQueryKey, getHealthCheckQueryKey, useHealthCheck,
  useGetCards, useGetCategories, useGetCategorySummary, useGetMovements, useGetMonthStatus,
  useCreateCard, useUpdateCard, useDeleteCard, useSelectCard,
  useCreateMovement, useUpdateMovement, useDeleteMovement, useStartMonth,
  useCreatePurchase, useUpdatePurchase, useDeletePurchase, useGetLastFutureMonth, useGetMonthPreview,
  useCreateRecurring, useUpdateRecurring, useDeleteRecurring,
  getGetLastFutureMonthQueryKey, getGetMonthPreviewQueryKey,
  type Cards, type Category, type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard,
  FilePenLine, LayoutDashboard, Plus, Tag, Trash2, X,
} from 'lucide-react';
import { CardCarousel, type CarouselCard } from '@/components/card-carousel';
import { AppTabs } from '@/components/app-tabs';
import { MonthNav } from '@/components/month-nav';
import { ScopeDialog } from '@/components/scope-dialog';
import { Progress } from '@/components/progress';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { useRememberMonth } from '@/lib/last-month';
import { CARD_COLOR_KEYS, CARD_COLORS, type CardColor } from '@/lib/card-colors';
import {
  capitalize, currentMonth, dateLabel, defaultDateFor, firstDayOf, isFutureMonth, lastDayOf,
  money, monthLabel, monthName, monthOf, plural, shiftMonth, type MonthKey,
} from '@/lib/format';

type DialogKind = 'card' | 'movement';
type DialogRecord = {
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

function Dialog({ kind, initial, month, categories, busy, onClose, onSave }: {
  kind: DialogKind; initial: DialogRecord; month: MonthKey; categories: Category[]; busy: boolean;
  onClose: () => void; onSave: (values: DialogRecord) => void;
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
  // Scrolls (instead of clipping) when the keyboard shrinks the viewport, and stays clear of the system bars.
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className={dialogOverlay} onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <form onSubmit={submit} className={dialogPanel}>
      <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">{kind === 'card' ? 'Visão principal' : 'Registro confirmado'}</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{title}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
      {kind === 'movement' ? <>
        <label className="field-label">O que foi?</label><input data-testid="input-movement-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: mercado da semana" className="field-input mb-4"/>
        <label className="field-label">Categoria</label>
        <div className="relative mb-4"><select data-testid="select-movement-category" disabled={onlyThisMonth} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none disabled:opacity-60"><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-[#768579]" size={16}/></div>
        {(!isEdit || editsPurchase) && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e6dfd1] bg-[#f4f0e6] px-4 py-3">
          <span id="purchase-switch-label" className="text-[13px] font-semibold text-[#3d5948]">Compra parcelada</span>
          <button type="button" role="switch" data-testid="switch-installments" aria-checked={isPurchase} aria-labelledby="purchase-switch-label" disabled={isEdit} onClick={() => { setIsPurchase(!isPurchase); if (!isPurchase) setIsRecurring(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-70 ${isPurchase ? 'bg-[#28513f]' : 'bg-[#cfc8b9]'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPurchase ? 'left-[22px]' : 'left-0.5'}`}/></button>
        </div>}
        {!isEdit && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e6dfd1] bg-[#f4f0e6] px-4 py-3">
          <span id="recurring-switch-label" className="text-[13px] font-semibold text-[#3d5948]">Compra recorrente</span>
          <button type="button" role="switch" data-testid="switch-recurring" aria-checked={isRecurring} aria-labelledby="recurring-switch-label" onClick={() => { setIsRecurring(!isRecurring); if (!isRecurring) setIsPurchase(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition ${isRecurring ? 'bg-[#28513f]' : 'bg-[#cfc8b9]'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isRecurring ? 'left-[22px]' : 'left-0.5'}`}/></button>
        </div>}
      </> : <>
        <label className="field-label">Nome do cartão</label><input data-testid="input-card-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cartão principal" className="field-input mb-4"/>
      </>}
      {kind === 'movement' && <>
      <label className="field-label">{isPurchase ? 'Valor total da compra' : isRecurring ? 'Valor mensal' : 'Valor da compra'}</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input data-testid="input-movement-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      </>}
      {kind === 'movement' && isPurchase && <div className={`mb-4 grid gap-3 ${editsPurchase ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="min-w-0"><label htmlFor="input-installment-count" className="field-label">Nº de parcelas</label><input id="input-installment-count" data-testid="input-installment-count" required type="number" step="1" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} className="field-input"/></div>
        <div className="min-w-0"><label htmlFor="input-installment" className="field-label">Parcela neste mês</label><input id="input-installment" data-testid="input-installment" required type="number" step="1" value={installment} onChange={(e) => setInstallment(e.target.value)} className="field-input"/></div>
        {editsPurchase && <div className="min-w-0"><label htmlFor="input-first-installment" className="field-label">Começa na parcela</label><input id="input-first-installment" data-testid="input-first-installment" required type="number" step="1" value={firstInstallment} onChange={(e) => setFirstInstallment(e.target.value)} className="field-input"/></div>}
      </div>}
      {kind === 'movement' && <><label className="field-label">Data da compra</label><input data-testid="input-movement-date" required type="date" min={editsRecurring ? firstDayOf(chargeMonth) : undefined} max={editsRecurring ? lastDayOf(chargeMonth) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className={`field-input ${isPurchase || isRecurring ? 'mb-3' : 'mb-6'}`}/></>}
      {kind === 'movement' && isRecurring && <div className="mb-6 space-y-3">
        {!onlyThisMonth && <div><label htmlFor="input-recurring-last-month" className="field-label">Até (mês, opcional)</label><input id="input-recurring-last-month" data-testid="input-recurring-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/></div>}
        {date && <p data-testid="text-recurring-preview" className="text-[11px] text-[#5d7364]"><b className="font-semibold text-[#3d5948]">Todo mês, dia {Number(date.slice(8, 10))}</b>, a partir de {monthLabel(date.slice(0, 7))} · {lastMonth && !onlyThisMonth ? `até ${monthLabel(lastMonth)}` : 'sem data final'}</p>}
        {editsRecurring && <p data-testid="text-recurring-warning" className="rounded-xl bg-[#f5e9e1] px-3 py-2 text-[11px] leading-5 text-[#8c5a4c]">{onlyThisMonth ? `A mudança vale só para ${monthLabel(chargeMonth)}.` : 'As mudanças valem deste mês em diante.'}</p>}
      </div>}
      {kind === 'movement' && isPurchase && <div className="mb-6 space-y-2">
        {split && <p data-testid="text-installment-preview" className="text-[11px] text-[#5d7364]"><b className="font-semibold text-[#3d5948]">{installmentCount}x de {money(split.base)}</b> · última em {split.lastLabel}{split.first !== split.base && <> · 1ª de {money(split.first)}</>}</p>}
        {editsPurchase && <p data-testid="text-purchase-warning" className="rounded-xl bg-[#f5e9e1] px-3 py-2 text-[11px] leading-5 text-[#8c5a4c]">As mudanças valem para todas as parcelas.</p>}
      </div>}
      {kind === 'card' && <><span id="card-color-label" className="field-label">Cor do cartão</span><div role="group" aria-labelledby="card-color-label" className="mb-6 flex flex-wrap gap-2.5">{CARD_COLOR_KEYS.map((key) => <button key={key} type="button" data-testid={`button-card-color-${key}`} aria-label={CARD_COLORS[key].label} aria-pressed={color === key} onClick={() => setColor(key)} className={`grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-[#fbf8f0] transition ${color === key ? 'ring-2 ring-[#294438]' : 'hover:scale-105'}`} style={{ background: CARD_COLORS[key].background }}>{color === key && <Check size={15} className="text-white"/>}</button>)}</div></>}
      <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button><button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button></div>
    </form>
    </div>
    </div>
  </div>;
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
  const preview = useGetMonthPreview(cardId, month, { query: { queryKey: getGetMonthPreviewQueryKey(cardId, month), enabled: isFuture && Boolean(card), refetchOnWindowFocus: true } }).data;
  const summary = summaryQuery.data ?? [];
  const [filter, setFilter] = useState('all');
  const [dialog, setDialog] = useState<{ kind: DialogKind; initial: DialogRecord } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [showAll, setShowAll] = useState(false);
  // RF-04 / RF-05: editing or deleting a charge of a recurring purchase asks for the scope first.
  const [scopeAsk, setScopeAsk] = useState<{ action: 'edit' | 'delete'; movement: Movement } | null>(null);

  // Prefix keys: refreshes every card and month, plus the history, the totals and the planned installments.
  const refresh = () => {
    for (const queryKey of [getGetCardsQueryKey(), getGetCardQueryKey(), getGetConsolidatedHistoryQueryKey(), getGetCategoriesQueryKey(), getGetCategorySummaryQueryKey(), getGetMovementsQueryKey(), getGetMonthHistoryQueryKey(), ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  // Validation errors from the store are already written for the user.
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
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
  const askDelete = (label: string) => window.confirm(`Remover ${label}? Esta ação não pode ser desfeita.`);
  const editMovement = (movement: Movement) => movement.recurring ? setScopeAsk({ action: 'edit', movement }) : setDialog({
    kind: 'movement',
    initial: movement.purchase
      ? { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.purchase.totalAmount, date: movement.date, isPurchase: true, purchaseId: movement.purchase.id, installmentCount: movement.purchase.installmentCount, installment: movement.installment, firstInstallment: movement.purchase.firstInstallment }
      : { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date },
  });
  const chooseScope = (scope: 'month' | 'forward') => {
    if (!scopeAsk?.movement.recurring) return;
    const { action, movement } = scopeAsk;
    const recurring = movement.recurring!;
    const chargeMonth = monthOf(movement.date);
    setScopeAsk(null);
    if (action === 'edit') {
      setDialog({ kind: 'movement', initial: { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date, isRecurring: true, recurringId: recurring.id, lastMonth: recurring.lastMonth, scope } });
      return;
    }
    const what = scope === 'month' ? `“${movement.description}” só em ${monthLabel(chargeMonth)}` : `“${movement.description}” de ${monthLabel(chargeMonth)} em diante`;
    if (askDelete(what)) deleteRecurring.mutate({ recurringId: recurring.id, month: chargeMonth, scope });
  };
  const removeMovement = (movement: Movement) => {
    if (movement.recurring) { setScopeAsk({ action: 'delete', movement }); return; }
    if (movement.purchase) { if (window.confirm(`Remover a compra parcelada “${movement.description}” e todas as suas parcelas? Esta ação não pode ser desfeita.`)) deletePurchase.mutate({ purchaseId: movement.purchase.id }); }
    else if (askDelete(`a compra “${movement.description}”`)) deleteMovement.mutate({ movementId: movement.id });
  };

  if (loading) return <main className="min-h-safe bg-[#f5f1e7] p-5 sm:p-10"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-5 w-36 rounded bg-[#e5dfd2]"/><div className="mt-8 h-12 w-64 rounded bg-[#e5dfd2]"/><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="h-64 rounded-3xl bg-[#e9e3d7]"/><div className="h-64 rounded-3xl bg-[#e9e3d7]"/></div><div className="mt-6 h-72 rounded-3xl bg-[#e9e3d7]"/></div></main>;
  if (cardsQuery.isError || movementsQuery.isError) return <main className="flex min-h-safe items-center justify-center bg-[#f5f1e7] p-6"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp/></div><h1 className="mt-5 font-display text-3xl text-[#234638]">Vamos tentar de novo?</h1><p className="mt-3 text-sm leading-6 text-[#758075]">Não conseguimos abrir seu caderno agora. Sua informação continua segura.</p><button onClick={() => { void cardsQuery.refetch(); void movementsQuery.refetch(); }} className="mt-6 rounded-full bg-[#28513f] px-6 py-3 text-sm font-semibold text-[#fffaf0]">Tentar novamente</button></div></main>;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-12 pt-5 sm:px-8 lg:px-12">
      <header className="enter hidden items-center justify-between border-b border-[#ded8ca] pb-5 sm:flex">
        <div className="flex items-center gap-2 rounded-full border border-[#ddd7c9] bg-[#f9f6ee] px-3.5 py-2 text-[11px] text-[#64766a]"><span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-[#d78470]' : 'bg-[#6d9d79]'}`}/>{health.isError ? 'Sincronização pausada' : 'Seu caderno está em dia'}</div>
      </header>
      <MonthNav area="cards" month={month} canGoNext={canGoNext}/>
      <AppTabs/>

      {isFuture && <p data-testid="text-preview-banner" className="enter mt-3 flex items-start gap-2 rounded-2xl border border-[#e6d7b8] bg-[#f8efd9] px-4 py-3 text-[11px] leading-5 text-[#7a6a45]"><CalendarDays size={14} className="mt-0.5 shrink-0"/><span><b className="font-semibold">{capitalize(monthName(month))} ainda não começou:</b> aparecem as parcelas e cobranças previstas e as compras já registradas.</span></p>}

      <section className="enter mt-6 flex flex-wrap justify-end gap-2" style={{ animationDelay: '.06s' }}>
        <button data-testid="button-new-movement" onClick={() => setDialog({ kind: 'movement', initial: {} })} disabled={!card} className="flex w-fit items-center gap-2 rounded-full bg-[#28513f] px-5 py-3.5 text-[13px] font-semibold text-[#fffaf0] shadow-[0_8px_18px_-10px_rgba(38,80,61,.7)] transition hover:-translate-y-0.5 hover:bg-[#1f4333] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16}/> Registrar compra</button>
      </section>

      {!cards.length ? <section className="enter mt-9 overflow-hidden rounded-[28px] bg-[#28513f] p-7 text-[#fffaf0] sm:p-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center"><div className="max-w-xl"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#f1d68e]"><CreditCard size={22}/></div><p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#d8c991]">Um bom começo</p><h2 className="mt-2 font-display text-3xl sm:text-4xl">Vamos anotar o seu cartão?</h2><p className="mt-3 text-sm leading-6 text-[#d0ded3]">Lance as compras e veja quanto deu a fatura de cada mês.</p></div><button data-testid="button-create-card" onClick={() => setDialog({ kind: 'card', initial: { color: cardsQuery.data?.nextColor } })} className="flex items-center gap-2 self-start rounded-full bg-[#f0d28b] px-5 py-3 text-sm font-semibold text-[#294438] transition hover:bg-[#f5dfa8]"><Plus size={16}/> Cadastrar cartão</button></div>
      </section> : <>
      <section className="mt-8">
        <div className="enter min-w-0">
          <CardCarousel cards={cards} month={month} onHistory={() => navigate('/historico')} selectedId={selectedCardId} onSelect={chooseCard}
            onAdd={() => setDialog({ kind: 'card', initial: { color: cardsQuery.data?.nextColor } })}
            onEdit={(item) => setDialog({ kind: 'card', initial: { id: item.id, name: item.name, color: item.color } })}
            onDelete={(item) => { if (askDelete(`o cartão “${item.name}” e todos os seus registros`)) deleteCard.mutate({ cardId: item.id }); }}/>
        </div>
      </section>
      </>}

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
        <div className="enter min-w-0" style={{ animationDelay: '.13s' }}>
          <div className="flex items-center gap-2 text-[#ac8f60]"><ArrowDownLeft size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Compras</p></div>
          <h2 className="mt-2 font-display text-[30px] text-[#234638]">O que já aconteceu</h2>
          {chips.length > 0 && <div data-testid="filter-categories" role="group" aria-label="Filtrar por categoria" className="mt-4 flex flex-wrap gap-2">
            {[{ key: 'all', label: 'Todas' }, ...chips].map((chip) => <button key={chip.key} data-testid={`filter-${chip.key}`} aria-pressed={activeFilter === chip.key} onClick={() => setFilter(chip.key)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${activeFilter === chip.key ? 'border-[#28513f] bg-[#28513f] text-[#fffaf0]' : 'border-[#d9d2c4] bg-[#faf7ef] text-[#496754] hover:bg-[#eee9dd]'}`}>{chip.label}</button>)}
          </div>}
          {activeFilter !== 'all' && <p data-testid="text-filter-total" className="mt-3 text-[11px] text-[#748075]">Total do filtro: <b className="font-mono-data font-medium text-[#a36354]">{money(visibleTotal)}</b></p>}
          <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0]">
            {visibleRows.length ? <div data-testid="list-movements" className="divide-y divide-[#ece6da]">
              {(showAll ? visibleRows : visibleRows.slice(0, 8)).map((row) => <div data-testid={row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`} key={row.key} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1e9df] text-[#bb7865]"><ArrowUpRight size={16}/></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-[#3d5948]"><span className="truncate">{row.description}</span>{row.installment && <span data-testid={row.movement ? `badge-installment-${row.movement.id}` : undefined} className="shrink-0 rounded-full bg-[#ece6da] px-2 py-0.5 font-mono-data text-[9px] font-medium text-[#6f7a6e]">{row.installment}/{row.installmentCount}</span>}{row.recurring && <span data-testid="badge-recurring" className="shrink-0 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]">Mensal</span>}{row.planned && <span className="shrink-0 rounded-full bg-[#f8efd9] px-2 py-0.5 text-[9px] font-medium text-[#7a6a45]">prevista</span>}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-[#8b9185]"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateLabel(row.date)}</span>{row.categoryName && <span data-testid="text-movement-category" className="truncate rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-medium text-[#52735c]">{row.categoryName}</span>}</p>
                </div>
                <div className="text-right"><p className="font-mono-data text-[12px] text-[#a36354]">− {money(row.amount)}</p>{row.movement && <div className="mt-1 flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button aria-label="Editar compra" onClick={() => editMovement(row.movement!)} className="rounded p-1 text-[#7c897e] hover:bg-[#eee9df]"><FilePenLine size={12}/></button><button aria-label="Excluir compra" onClick={() => removeMovement(row.movement!)} className="rounded p-1 text-[#ad6a5a] hover:bg-[#f4e8e1]"><Trash2 size={12}/></button></div>}</div>
              </div>)}
              {visibleRows.length > 8 && <button onClick={() => setShowAll(!showAll)} className="w-full border-t border-[#ece6da] py-3 text-[10px] font-semibold text-[#567360] hover:bg-[#f7f3e9]">{showAll ? 'Mostrar menos' : `Ver mais ${visibleRows.length - 8} compras`}</button>}
            </div> : <div className="px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f0eadd] text-[#9b8c69]"><ArrowDownLeft size={18}/></div><h3 data-testid="text-movements-empty" className="mt-3 font-display text-[20px] text-[#345443]">Ainda sem compras</h3><p className="mt-1 text-xs leading-5 text-[#7d887c]">{card ? `As compras de ${monthName(month)} aparecem aqui assim que você registrar.` : 'Cadastre um cartão para começar a registrar suas compras.'}</p>{card && <button onClick={() => setDialog({ kind: 'movement', initial: {} })} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Registrar a primeira compra</button>}</div>}
          </div>
        </div>

        <aside className="enter min-w-0" style={{ animationDelay: '.18s' }}>
          <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-[#ac8f60]"><Tag size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Resumo</p></div><h2 className="mt-2 font-display text-[30px] text-[#234638]">Por categoria</h2></div><button data-testid="button-categories" onClick={() => navigate('/categorias')} className="flex items-center gap-1.5 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-3.5 py-2.5 text-xs font-semibold text-[#496754] transition hover:bg-[#eee9dd]"><Tag size={14}/> Categorias</button></div>
          <div className="mt-5 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-5">
            {summary.length ? <ul data-testid="list-category-summary" className="space-y-4">
              {summary.map((item) => <li key={filterKey(item.categoryId)} data-testid={`row-summary-${filterKey(item.categoryId)}`}>
                <div className="flex items-baseline justify-between gap-3"><span className="truncate text-[13px] font-semibold text-[#345443]">{item.name ?? 'Sem categoria'}</span><span className="shrink-0 font-mono-data text-[13px] text-[#a36354]">{money(item.amount)}</span></div>
                <div className="mt-2 flex items-center gap-3"><div className="flex-1"><Progress value={item.percent} tone="green"/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(item.percent).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>
              </li>)}
            </ul> : <p className="py-4 text-center text-xs leading-5 text-[#7d887c]">O resumo por categoria aparece quando houver compras no mês.</p>}
          </div>
        </aside>
      </section>

      <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-[#ded8ca] pt-4 text-[10px] text-[#919489] sm:flex-row"><span>Um jeito mais gentil de acompanhar o que importa.</span><span className="font-mono-data tracking-wide">CONTROLE DO CARTÃO · 01</span></footer>
    </div>
    {dialog && <Dialog kind={dialog.kind} initial={dialog.initial} month={month} categories={categories} busy={isMutating} onClose={() => setDialog(null)} onSave={submitDialog}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.movement.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
