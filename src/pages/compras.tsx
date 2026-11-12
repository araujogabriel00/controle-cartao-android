import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetAllMovementsQueryKey, getGetCardQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey, getGetConsolidatedHistoryQueryKey, getGetMonthHistoryQueryKey,
  useCreateMovement, useCreatePurchase, useCreateRecurring, useDeleteMovement, useDeletePurchase, useDeleteRecurring, useGetAllMovements, useGetCards, useGetCategories,
  useUpdateMovement, useUpdatePurchase, useUpdateRecurring,
  type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import { ArrowLeft, CircleHelp, CreditCard, Receipt, Search, SlidersHorizontal, X } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { scopeSuffix, undoable } from '@/components/undo-snackbar';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { Dialog, type DialogRecord } from '@/pages/dashboard';
import { ScopeDialog } from '@/components/scope-dialog';
import { chargeDialog, chargeOfMovement, chargeOfPlanned, type RecurringCharge } from '@/lib/recurring-charge';
import { dialogOverlay } from '@/lib/dialog-styles';
import { areaPath, capitalize, currentMonth, dateLabel, defaultDateFor, money, monthLabel, monthName, monthOf, plural, purchasesPath, shiftMonth, type MonthKey } from '@/lib/format';
import { useHideValues } from '@/lib/hide-values';

// One line of the list: a registered purchase or a planned installment.
type Row = {
  key: string; description: string; date: string; amount: number; categoryId: number | null; categoryName: string | null;
  installment?: number; installmentCount?: number; recurring?: boolean; movement?: Movement; planned?: PlannedInstallment;
};

// D14: o mês pedido, ou o mais recente anterior com compras, ou o mais próximo depois dele; nenhum se a lista está vazia.
export function nearestMonth(available: string[], wanted: string): string | null {
  if (available.includes(wanted)) return wanted;
  const earlier = available.filter((item) => item < wanted).sort().pop();
  if (earlier) return earlier;
  return available.filter((item) => item > wanted).sort()[0] ?? null;
}

const sum = (rows: Row[]) => Math.round(rows.reduce((total, row) => total + row.amount, 0) * 100) / 100;

// D11: os três tipos do filtro; combinam com "ou" entre si e com "e" com a categoria.
type TypeKey = 'installment' | 'recurring' | 'planned';
const TYPES: { key: TypeKey; label: string; test: (row: Row) => boolean }[] = [
  { key: 'installment', label: 'Parceladas', test: (row) => row.installment !== undefined },
  { key: 'recurring', label: 'Mensais', test: (row) => Boolean(row.recurring) },
  { key: 'planned', label: 'Previstas', test: (row) => row.planned !== undefined },
];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const shortMonth = (month: string) => `${SHORT_MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`;
const passes = (row: Row, category: string, types: TypeKey[]) =>
  (category === 'all' || (category === 'none' ? row.categoryId === null : row.categoryId === Number(category)))
  && (types.length === 0 || TYPES.some((type) => types.includes(type.key) && type.test(row)));
const plainMoney = (value: number) => money(value).replace('R$', '').trim();

// Every purchase of the selected card, in any month (specs/todas-as-compras.md): edit and delete
// follow the rules of each kind. Creating is only through the footer "+" (D9). A lista abre no mês de onde a pessoa
// veio e o voltar leva de volta a ele (specs/redesign-v2-historico-e-compras.md D13).
export default function Compras({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const cardsQuery = useGetCards(currentMonth(), { query: { queryKey: getGetCardsQueryKey(currentMonth()), refetchOnWindowFocus: true } });
  const card = cardsQuery.data?.cards.find((item) => item.id === cardsQuery.data?.selectedCardId);
  const cardId = card?.id ?? 0;
  const all = useGetAllMovements(cardId, { query: { queryKey: getGetAllMovementsQueryKey(cardId), enabled: Boolean(card), refetchOnWindowFocus: true } });
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const hidden = useHideValues();
  // D5, RN-03: busca e filtros vivem na tela; trocar de mês não a remonta (a rota é uma só) e sair da tela os descarta.
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [category, setCategory] = useState('all');
  const [types, setTypes] = useState<TypeKey[]>([]);
  const [sheet, setSheet] = useState<{ category: string; types: TypeKey[] } | null>(null);
  const [newPurchase, setNewPurchase] = useState(false);
  const [dialog, setDialog] = useState<DialogRecord | null>(null);
  // RF-04 / RF-05 of compra-recorrente: a charge of a recurring purchase asks for the scope first.
  const [scopeAsk, setScopeAsk] = useState<{ action: 'edit' | 'delete'; charge: RecurringCharge } | null>(null);
  const { notice, notify, failed, formError } = useNotice(Boolean(dialog));

  const refresh = () => {
    for (const queryKey of [getGetCardsQueryKey(), getGetCardQueryKey(), getGetConsolidatedHistoryQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], getGetMonthHistoryQueryKey(), ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const saved = (text: string) => ({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify(text); }, onError: failed } });
  // D1: apagar não pergunta; o aviso com Desfazer abre depois. O formulário de edição, se estava aberto, fecha.
  const removed = { mutation: { onSuccess: () => { refresh(); setDialog(null); }, onError: failed } };
  const updateMovement = useUpdateMovement(saved('Compra atualizada.'));
  const updatePurchase = useUpdatePurchase(saved('Compra parcelada atualizada.'));
  const updateRecurring = useUpdateRecurring(saved('Compra recorrente atualizada.'));
  const deleteMovement = useDeleteMovement(removed);
  const deletePurchase = useDeletePurchase(removed);
  const deleteRecurring = useDeleteRecurring(removed);
  const busy = updateMovement.isPending || updatePurchase.isPending || updateRecurring.isPending;

  const rows: Row[] = [
    ...(all.data?.movements ?? []).map((movement): Row => ({ key: `m${movement.id}`, description: movement.description, date: movement.date, amount: movement.amount, categoryId: movement.categoryId, categoryName: movement.categoryName, installment: movement.installment, installmentCount: movement.purchase?.installmentCount ?? movement.installmentCount, recurring: movement.recurringId !== undefined, movement })),
    ...(all.data?.planned ?? []).map((planned): Row => ({ key: `p${planned.kind}${planned.purchaseId ?? planned.recurringId}-${planned.installment ?? 0}`, description: planned.description, date: planned.date, amount: planned.amount, categoryId: planned.categoryId, categoryName: planned.categoryName, installment: planned.installment, installmentCount: planned.installmentCount, recurring: planned.kind === 'recurring', planned })),
  ];
  const term = search.trim().toLowerCase();
  const byDate = (a: Row, b: Row) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key);
  const filtered = rows.filter((row) => passes(row, category, types));
  const filterCount = (category !== 'all' ? 1 : 0) + types.length;
  const rowsOf = (list: Row[], target: string) => list.filter((row) => monthOf(row.date) === target).sort(byDate);
  const monthRows = rowsOf(filtered, month);
  const monthTotalCount = rows.filter((row) => monthOf(row.date) === month).length;
  // D8: a busca vale para todos os meses, com os filtros, agrupada por mês.
  const results = term ? filtered.filter((row) => row.description.toLowerCase().includes(term)).sort(byDate) : [];
  const groups = [...new Set(results.map((row) => monthOf(row.date)))].map((groupMonth) => ({ month: groupMonth, rows: rowsOf(results, groupMonth) }));
  // D2, RN-02: do mês da compra mais antiga ao último com compra, sempre com o mês atual e o aberto; sem pular meses.
  const spanMonths = [...rows.map((row) => monthOf(row.date)), currentMonth(), month].sort();
  const strip: string[] = [];
  for (let m = spanMonths[spanMonths.length - 1]; m >= spanMonths[0]; m = shiftMonth(m, -1)) strip.push(m);
  const categoryLabel = category === 'none' ? 'Sem categoria' : categories.find((item) => String(item.id) === category)?.name ?? '';
  const openMonth = (target: string) => navigate(purchasesPath(target), { replace: true });

  // D3, D5: a pílula do mês aberto vai para a vista e a lista volta ao topo ao trocar de mês.
  const stripRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    stripRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
    if (!firstRender.current) document.documentElement.scrollTop = 0;
    firstRender.current = false;
  }, [month, all.data, searching]);

  const closeSearch = () => { setSearching(false); setSearch(''); };
  const createDone = { mutation: { onSuccess: () => { refresh(); setNewPurchase(false); notify('Compra registrada.'); }, onError: failed } };
  const createMovement = useCreateMovement(createDone);
  const createPurchase = useCreatePurchase(createDone);
  const createRecurring = useCreateRecurring(createDone);
  const creating = createMovement.isPending || createPurchase.isPending || createRecurring.isPending;
  const sheetCount = sheet ? rows.filter((row) => passes(row, sheet.category, sheet.types)).length : 0;

  const editMovement = (movement: Movement) => {
    if (movement.recurring) { setScopeAsk({ action: 'edit', charge: chargeOfMovement(movement)! }); return; }
    setDialog(movement.purchase
      ? { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.purchase.totalAmount, date: movement.date, isPurchase: true, purchaseId: movement.purchase.id, installmentCount: movement.purchase.installmentCount, installment: movement.installment, firstInstallment: movement.purchase.firstInstallment }
      : { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date });
  };
  const editPlanned = (planned: PlannedInstallment) => {
    const charge = chargeOfPlanned(planned);
    if (charge) { setScopeAsk({ action: 'edit', charge }); return; }
    if (planned.purchase) setDialog({
      id: planned.purchase.id, categoryId: planned.categoryId, description: planned.description, amount: planned.purchase.totalAmount, date: planned.date, isPurchase: true, purchaseId: planned.purchase.id,
      installmentCount: planned.purchase.installmentCount, installment: planned.installment, firstInstallment: planned.purchase.firstInstallment,
    });
  };
  const removePlanned = (planned: PlannedInstallment) => {
    const charge = chargeOfPlanned(planned);
    if (charge) setScopeAsk({ action: 'delete', charge });
    else if (planned.purchase) removePurchase(planned.purchase.id, planned.description);
  };
  const removePurchase = (purchaseId: number, description: string) => {
    deletePurchase.mutate({ purchaseId }, undoable(description, `${description} removida.`));
  };
  const removeMovement = (movement: Movement) => {
    if (movement.recurring) setScopeAsk({ action: 'delete', charge: chargeOfMovement(movement)! });
    else if (movement.purchase) removePurchase(movement.purchase.id, movement.description);
    else deleteMovement.mutate({ movementId: movement.id }, undoable(movement.description, `${movement.description} removida.`));
  };
  const chooseScope = async (scope: 'month' | 'forward') => {
    if (!scopeAsk) return;
    const { action, charge } = scopeAsk;
    const chargeMonth = monthOf(charge.date);
    setScopeAsk(null);
    if (action === 'edit') { setDialog(chargeDialog(charge, scope)); return; }
    deleteRecurring.mutate({ recurringId: charge.recurringId, month: chargeMonth, scope }, undoable(charge.description, `${charge.description} removida${scopeSuffix(scope)}.`));
  };
  const submit = (values: DialogRecord) => {
    if (!dialog) return;
    const categoryId = values.categoryId ?? null;
    const date = values.date ?? dialog.date ?? '';
    if (values.isRecurring) {
      const data = { description: values.description ?? '', amount: Number(values.amount), date, lastMonth: values.lastMonth ?? null };
      updateRecurring.mutate({ recurringId: dialog.recurringId!, month: monthOf(dialog.date ?? date), scope: dialog.scope ?? 'forward', categoryId, data });
    } else if (values.isPurchase) {
      const data = { description: values.description ?? '', totalAmount: Number(values.amount), installmentCount: Number(values.installmentCount), installment: Number(values.installment), firstInstallment: values.firstInstallment, date };
      updatePurchase.mutate({ purchaseId: dialog.purchaseId!, categoryId, data });
    } else {
      updateMovement.mutate({ movementId: dialog.id!, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date } });
    }
  };

  const iconButton = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:bg-hover';
  const loading = cardsQuery.isLoading || all.isLoading;
  const failedLoad = cardsQuery.isError || all.isError;
  const noPurchases = !loading && !failedLoad && rows.length === 0;

  // Uma compra da lista (D16: o item, o ⋯, a edição e a exclusão são os de antes).
  const renderRow = (row: Row) => <li key={row.key} data-testid={row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`} className="flex items-center gap-1 pr-1">
    <button type="button" aria-label={`Editar ${row.description}`} onClick={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} className="flex min-h-16 min-w-0 flex-1 flex-col justify-center py-3 pl-4 text-left transition hover:bg-hover">
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{row.description}</span>
        <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(row.amount)}</span>
      </span>
      <span className="mt-0.5 block text-[14px] text-ink-soft">{[row.installment ? `Parcela ${row.installment}/${row.installmentCount}` : null, row.categoryName, dateLabel(row.date), row.recurring ? 'Mensal' : null, row.planned ? 'prevista' : null].filter(Boolean).join(' · ')}</span>
    </button>
    <RowMenu tall title={row.description} editTestId={`button-edit-${row.key}`} deleteTestId={`button-delete-${row.key}`} onEdit={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} onDelete={() => void (row.movement ? removeMovement(row.movement) : removePlanned(row.planned!))}/>
  </li>;

  const tags: { id: string; label: string; clear: () => void }[] = [
    ...(category !== 'all' ? [{ id: 'category', label: categoryLabel, clear: () => setCategory('all') }] : []),
    ...TYPES.filter((type) => types.includes(type.key)).map((type) => ({ id: `type-${type.key}`, label: type.label, clear: () => setTypes(types.filter((key) => key !== type.key)) })),
  ];
  const nearest = nearestMonth([...new Set(filtered.map((row) => monthOf(row.date)))], month);

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      {searching
        // D8: o cabeçalho vira "← campo de busca com ✕".
        ? <div className="flex items-center gap-2">
          <button type="button" data-testid="button-search-back" aria-label="Sair da busca" onClick={closeSearch} className={iconButton}><ArrowLeft size={20}/></button>
          <label className="relative block min-w-0 flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"/><input data-testid="input-search" aria-label="Buscar compra" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pela descrição" className="field-input h-12 rounded-full pl-11 pr-12"/>
            <button type="button" data-testid="button-search-clear" aria-label={search ? 'Limpar a busca' : 'Fechar a busca'} onClick={() => (search ? setSearch('') : closeSearch())} className="absolute right-0 top-0 grid h-12 w-12 place-items-center rounded-full text-ink-soft"><X size={18}/></button>
          </label>
        </div>
        : <div className="flex items-center justify-between gap-2">
          <BackButton tall onClick={() => navigate(areaPath('cards', month))}/>
          {!noPurchases && !loading && !failedLoad && <div className="flex items-center gap-2">
            <button type="button" data-testid="button-search" aria-label="Buscar" onClick={() => setSearching(true)} className={iconButton}><Search size={20}/></button>
            <button type="button" data-testid="button-filters" aria-label={filterCount ? `Filtros, ${plural(filterCount, 'ativo', 'ativos')}` : 'Filtros'} onClick={() => setSheet({ category, types })} className={`${iconButton} relative`}><SlidersHorizontal size={20}/>{filterCount > 0 && <span data-testid="text-filter-count" aria-hidden className="absolute -right-0.5 -top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-brand text-[12px] font-semibold text-on-brand">{filterCount}</span>}</button>
          </div>}
        </div>}

      {!searching && <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <h1 className="font-display text-[28px] leading-tight text-ink">Todas as compras</h1>
        <p data-testid="text-purchases-card" className="mt-1 text-[14px] text-ink-soft">{card?.name ?? 'Cartão'} · todos os meses</p>
      </section>}

      {loading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-line"/><div className="h-16 rounded-2xl bg-line"/></div>
      : failedLoad ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as compras</h3><button onClick={() => { void cardsQuery.refetch(); void all.refetch(); }} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : noPurchases ? <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand"><Receipt size={16}/></div><p data-testid="text-purchases-empty" className="mt-3 text-[14px] text-ink-soft">Nenhuma compra neste cartão.</p></div>
      : <>
        {!searching && <>
          {/* D2, D3, RF-02: um mês por pílula, do mais recente ao mais antigo; só a faixa rola na horizontal. */}
          <div ref={stripRef} data-testid="strip-months" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {strip.map((m) => {
              const inMonth = rowsOf(filtered, m);
              const total = sum(inMonth);
              const active = m === month;
              const name = `${capitalize(monthLabel(m as MonthKey))}, ${plural(inMonth.length, 'compra', 'compras')}${hidden || inMonth.length === 0 ? '' : `, ${money(total)}`}`;
              return <button key={m} type="button" data-testid={`pill-${m}`} aria-label={name} aria-pressed={active} onClick={() => openMonth(m)} className={`flex h-16 min-w-24 shrink-0 flex-col items-start justify-center rounded-[18px] border-[1.5px] px-3 text-left transition ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink hover:bg-hover'}`}>
                <span className="text-[14px] font-semibold">{shortMonth(m)}</span>
                <span className="font-mono-data text-[14px]">{inMonth.length ? plainMoney(total) : '—'}</span>
              </button>;
            })}
          </div>
          {tags.length > 0 && <div data-testid="list-filter-tags" className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => <button key={tag.id} type="button" data-testid={`tag-${tag.id}`} aria-label={`Remover o filtro ${tag.label}`} onClick={tag.clear} className="flex h-12 items-center gap-2 rounded-full border border-brand bg-tint pl-4 pr-3 text-[15px] font-semibold text-brand"><span className="truncate">{tag.label}</span><X size={18} className="shrink-0"/></button>)}
          </div>}

          <section aria-label={`Compras de ${monthLabel(month)}`} className="mt-5">
            <div className="flex items-baseline justify-between gap-3 pb-2">
              <h2 data-testid="text-month-title" className="font-display text-[20px] text-ink">{capitalize(monthLabel(month))}</h2>
              <span data-testid="text-month-count" className="text-[14px] text-ink-soft">{filterCount ? `${monthRows.length} de ${plural(monthTotalCount, 'compra', 'compras')}` : plural(monthRows.length, 'compra', 'compras')}</span>
            </div>
            {monthRows.length
              ? <div data-testid="list-all-purchases"><div data-testid={`group-${month}`} id={`group-${month}`}><ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{monthRows.map(renderRow)}</ul>
                <p className="mt-3 flex items-baseline justify-between gap-3 text-[14px] text-ink-soft"><span>{filterCount ? 'Os filtros valem para todos os meses.' : ''}</span><span>Total do mês <b data-testid={`total-${month}`} className="font-mono-data font-medium text-ink">{money(sum(monthRows))}</b></span></p></div></div>
              // D13, D14: mês sem compras, ou vazio por causa do filtro.
              : <div data-testid="empty-month" className="rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-tint text-brand"><CreditCard size={20}/></div>
                <p data-testid="text-purchases-empty" className="mt-3 font-display text-[20px] text-ink">{filterCount ? `Nenhuma compra com esses filtros em ${monthName(month)}` : `Nenhuma compra em ${monthName(month)}`}</p>
                {filterCount
                  ? <button type="button" data-testid="button-clear-filters" onClick={() => { setCategory('all'); setTypes([]); }} className="mt-4 h-[52px] rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Limpar filtros</button>
                  : <button type="button" data-testid="button-new-purchase-month" onClick={() => setNewPurchase(true)} className="mt-4 h-[52px] rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Lançar compra de {monthName(month)}</button>}
                {nearest && nearest !== month && <button type="button" data-testid="button-nearest-month" onClick={() => openMonth(nearest)} className="mt-2 block min-h-12 w-full text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Ir para o mês mais recente com compras</button>}
              </div>}
          </section>
        </>}

        {searching && <section aria-label="Resultados da busca" className="mt-4">
          {tags.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{tags.map((tag) => <button key={tag.id} type="button" data-testid={`tag-${tag.id}`} aria-label={`Remover o filtro ${tag.label}`} onClick={tag.clear} className="flex h-12 items-center gap-2 rounded-full border border-brand bg-tint pl-4 pr-3 text-[15px] font-semibold text-brand"><span className="truncate">{tag.label}</span><X size={18} className="shrink-0"/></button>)}</div>}
          {groups.length
            ? <div data-testid="list-all-purchases" className="space-y-6">
              {groups.map((group) => <section key={group.month} id={`group-${group.month}`} data-testid={`group-${group.month}`}>
                <div className="flex items-baseline justify-between gap-3 pb-2"><h2 className="font-display text-[20px] text-ink">{capitalize(monthLabel(group.month as MonthKey))}</h2><span className="text-[14px] text-ink-soft">{plural(group.rows.length, 'resultado', 'resultados')}</span></div>
                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{group.rows.map(renderRow)}</ul>
              </section>)}
              <p data-testid="text-search-footer" className="flex items-baseline justify-between gap-3 text-[14px] text-ink-soft"><span>{plural(results.length, 'resultado', 'resultados')}</span><span>total <b className="font-mono-data font-medium text-ink">{money(sum(results))}</b></span></p>
            </div>
            : <p data-testid="text-purchases-empty" className="rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center text-[14px] text-ink-soft">{term ? 'Nenhuma compra encontrada.' : 'Digite para buscar em todos os meses.'}</p>}
        </section>}
      </>}
    </div>

    {dialog && <Dialog key={dialog.id} kind="movement" initial={dialog} month={currentMonth()} categories={categories} busy={busy} error={formError} onClose={() => setDialog(null)} onSave={submit}/>}
    {newPurchase && card && <Dialog kind="movement" initial={{ date: defaultDateFor(month) }} month={month} categories={categories} busy={creating} error={formError} onClose={() => setNewPurchase(false)} onSave={(values) => {
      const categoryId = values.categoryId ?? null;
      const date = values.date ?? defaultDateFor(month);
      if (values.isRecurring) createRecurring.mutate({ cardId: card.id, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date, lastMonth: values.lastMonth ?? null } });
      else if (values.isPurchase) createPurchase.mutate({ cardId: card.id, categoryId, data: { description: values.description ?? '', totalAmount: Number(values.amount), installmentCount: Number(values.installmentCount), installment: Number(values.installment), firstInstallment: values.firstInstallment, date } });
      else createMovement.mutate({ cardId: card.id, categoryId, data: { description: values.description ?? '', amount: Number(values.amount), date } });
    }}/>}
    {sheet && <FilterSheet categories={categories} draft={sheet} count={sheetCount} onChange={setSheet} onClose={() => setSheet(null)} onApply={() => { setCategory(sheet.category); setTypes(sheet.types); setSheet(null); }}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.charge.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    <Notice notice={notice}/>
  </main>;
}

// D10: a folha de filtros (Categoria e Tipo); só vale ao tocar "Ver N compras", e o ✕ descarta.
function FilterSheet({ categories, draft, count, onChange, onClose, onApply }: {
  categories: { id: number; name: string }[]; draft: { category: string; types: TypeKey[] }; count: number;
  onChange: (value: { category: string; types: TypeKey[] }) => void; onClose: () => void; onApply: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const pill = (active: boolean) => `flex min-h-12 items-center rounded-full border px-4 text-[15px] font-semibold transition ${active ? 'border-brand bg-tint text-brand' : 'border-line bg-surface text-ink hover:bg-hover'}`;
  const options = [{ value: 'all', label: 'Todas' }, { value: 'none', label: 'Sem categoria' }, ...categories.map((item) => ({ value: String(item.id), label: item.name }))];
  return createPortal(<div className={`${dialogOverlay} flex items-end`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label="Filtros" data-testid="sheet-filters" className="enter mx-auto max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-t-[28px] border border-line bg-surface p-5 pb-6">
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line"/>
      <div className="flex items-center justify-between gap-3"><h2 className="font-display text-[22px] text-ink">Filtros</h2><button type="button" data-testid="button-close-filters" aria-label="Fechar os filtros" onClick={onClose} className="grid h-12 w-12 place-items-center rounded-full text-ink-soft hover:bg-hover"><X size={20}/></button></div>
      <h3 className="mt-3 text-[14px] font-semibold text-ink-soft">Categoria</h3>
      <div className="mt-2 flex flex-wrap gap-2">{options.map((option) => <button key={option.value} type="button" data-testid={`filter-category-${option.value}`} aria-pressed={draft.category === option.value} onClick={() => onChange({ ...draft, category: option.value })} className={pill(draft.category === option.value)}>{option.label}</button>)}</div>
      <h3 className="mt-5 text-[14px] font-semibold text-ink-soft">Tipo</h3>
      <div className="mt-2 flex flex-wrap gap-2">{TYPES.map((type) => { const on = draft.types.includes(type.key); return <button key={type.key} type="button" data-testid={`filter-type-${type.key}`} aria-pressed={on} onClick={() => onChange({ ...draft, types: on ? draft.types.filter((key) => key !== type.key) : [...draft.types, type.key] })} className={pill(on)}>{type.label}</button>; })}</div>
      <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
        <button type="button" data-testid="button-filters-clear" onClick={() => onChange({ category: 'all', types: [] })} className="h-[52px] rounded-full border border-line px-5 text-[15px] font-semibold text-ink-soft transition hover:bg-hover">Limpar</button>
        <button type="button" data-testid="button-filters-apply" onClick={onApply} className="h-[52px] rounded-full bg-brand px-5 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Ver {plural(count, 'compra', 'compras')}</button>
      </div>
    </div>
  </div>, document.body);
}
