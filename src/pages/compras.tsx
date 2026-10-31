import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetAllMovementsQueryKey, getGetCardQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey, getGetConsolidatedHistoryQueryKey, getGetMonthHistoryQueryKey,
  useDeleteMovement, useDeletePurchase, useDeleteRecurring, useGetAllMovements, useGetCards, useGetCategories,
  useUpdateMovement, useUpdatePurchase, useUpdateRecurring,
  type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import { ChevronDown, CircleHelp, Receipt, Search, X } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { scopeSuffix, undoable } from '@/components/undo-snackbar';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { Dialog, type DialogRecord } from '@/pages/dashboard';
import { ScopeDialog } from '@/components/scope-dialog';
import { chargeDialog, chargeOfMovement, chargeOfPlanned, type RecurringCharge } from '@/lib/recurring-charge';
import { areaPath, capitalize, currentMonth, dateLabel, money, monthLabel, monthOf, type MonthKey } from '@/lib/format';

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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
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
  const visible = rows
    .filter((row) => (category === 'all' || (category === 'none' ? row.categoryId === null : row.categoryId === Number(category))) && (!term || row.description.toLowerCase().includes(term)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
  const groups = [...new Set(visible.map((row) => monthOf(row.date)))].map((groupMonth) => ({ month: groupMonth, rows: visible.filter((row) => monthOf(row.date) === groupMonth) }));
  const categoryLabel = category === 'none' ? 'Sem categoria' : categories.find((item) => String(item.id) === category)?.name ?? '';

  // D13/D14: uma vez, ao carregar os dados, rola até o mês pedido; busca e filtro depois não voltam a rolar.
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !all.data) return;
    scrolled.current = true;
    const target = nearestMonth([...new Set(rows.map((row) => monthOf(row.date)))], month);
    if (target) document.getElementById(`group-${target}`)?.scrollIntoView?.({ block: 'start' });
  });

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

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton tall onClick={() => navigate(areaPath('cards', month))}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <h1 className="font-display text-[28px] leading-tight text-ink">Todas as compras</h1>
        <p data-testid="text-purchases-card" className="mt-1 text-[14px] text-ink-soft">{card?.name ?? 'Cartão'} · todos os meses</p>
      </section>

      <div className="mt-4 space-y-3">
        <label className="relative block"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"/><input data-testid="input-search" aria-label="Buscar compra" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pela descrição" className="field-input h-[52px] rounded-full pl-11 pr-4"/></label>
        <div className="flex min-h-12 items-center justify-between gap-3">
          {category === 'all'
            ? <label className="relative block">
                <select data-testid="select-category" aria-label="Filtrar por categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="field-input h-12 w-auto appearance-none rounded-full py-0 pl-4 pr-10 text-[15px] font-semibold">
                  <option value="all">Todas as categorias</option>
                  <option value="none">Sem categoria</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"/>
              </label>
            : <>
                <button type="button" data-testid="button-clear-category" aria-label={`Remover o filtro ${categoryLabel}`} onClick={() => setCategory('all')} className="flex h-12 min-w-0 max-w-[60%] items-center gap-2 rounded-full bg-tint pl-4 pr-3 text-[15px] font-semibold text-brand transition hover:bg-hover"><span className="truncate">{categoryLabel}</span><X size={18} className="shrink-0"/></button>
                <p data-testid="text-filter-total" className="shrink-0 text-right text-[14px] leading-5 text-ink-soft"><span className="block">Total do filtro</span><b className="block font-mono-data font-medium text-ink">{money(sum(visible))}</b></p>
              </>}
        </div>
      </div>

      {cardsQuery.isLoading || all.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-line"/><div className="h-16 rounded-2xl bg-line"/></div>
      : cardsQuery.isError || all.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as compras</h3><button onClick={() => { void cardsQuery.refetch(); void all.refetch(); }} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : groups.length ? <div data-testid="list-all-purchases" className="mt-6 space-y-7">
        {groups.map((group) => <section key={group.month} id={`group-${group.month}`} data-testid={`group-${group.month}`} className="scroll-mt-4">
          <div className="flex items-baseline justify-between gap-3 pb-2"><h2 className="font-display text-[20px] text-ink">{capitalize(monthLabel(group.month as MonthKey))}</h2><span data-testid={`total-${group.month}`} className="font-mono-data text-[15px] text-ink">{money(sum(group.rows))}</span></div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {group.rows.map((row) => <li key={row.key} data-testid={row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`} className="flex items-center gap-1 pr-1">
              <button type="button" aria-label={`Editar ${row.description}`} onClick={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} className="flex min-h-16 min-w-0 flex-1 flex-col justify-center py-3 pl-4 text-left transition hover:bg-hover">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{row.description}</span>
                  <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(row.amount)}</span>
                </span>
                <span className="mt-0.5 block text-[14px] text-ink-soft">{[row.installment ? `Parcela ${row.installment}/${row.installmentCount}` : null, row.categoryName, dateLabel(row.date), row.recurring ? 'Mensal' : null, row.planned ? 'prevista' : null].filter(Boolean).join(' · ')}</span>
              </button>
              <RowMenu tall title={row.description} editTestId={`button-edit-${row.key}`} deleteTestId={`button-delete-${row.key}`} onEdit={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} onDelete={() => void (row.movement ? removeMovement(row.movement) : removePlanned(row.planned!))}/>
            </li>)}
          </ul>
        </section>)}
      </div>
      : <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand"><Receipt size={16}/></div><p data-testid="text-purchases-empty" className="mt-3 text-[14px] text-ink-soft">{rows.length ? 'Nenhuma compra encontrada.' : 'Nenhuma compra neste cartão.'}</p>{rows.length > 0 && <button data-testid="button-clear-filters" onClick={() => { setSearch(''); setCategory('all'); }} className="mt-2 min-h-12 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Limpar busca e filtro</button>}</div>}
    </div>

    {dialog && <Dialog key={dialog.id} kind="movement" initial={dialog} month={currentMonth()} categories={categories} busy={busy} error={formError} onClose={() => setDialog(null)} onSave={submit}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.charge.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    <Notice notice={notice}/>
  </main>;
}
