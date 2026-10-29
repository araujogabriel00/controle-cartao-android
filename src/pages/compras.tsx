import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetAllMovementsQueryKey, getGetCardQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey, getGetConsolidatedHistoryQueryKey, getGetMonthHistoryQueryKey,
  useDeleteMovement, useDeletePurchase, useDeleteRecurring, useGetAllMovements, useGetCards, useGetCategories,
  useUpdateMovement, useUpdatePurchase, useUpdateRecurring,
  type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import { CalendarDays, CircleHelp, Receipt, Search } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { removeAsk, useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { Dialog, type DialogRecord } from '@/pages/dashboard';
import { ScopeDialog } from '@/components/scope-dialog';
import { chargeDialog, chargeOfMovement, chargeOfPlanned, type RecurringCharge } from '@/lib/recurring-charge';
import { capitalize, currentMonth, dateLabel, money, monthLabel, monthOf, type MonthKey } from '@/lib/format';

// One line of the list: a registered purchase or a planned installment.
type Row = {
  key: string; description: string; date: string; amount: number; categoryId: number | null; categoryName: string | null;
  installment?: number; installmentCount?: number; recurring?: boolean; movement?: Movement; planned?: PlannedInstallment;
};

const sum = (rows: Row[]) => Math.round(rows.reduce((total, row) => total + row.amount, 0) * 100) / 100;

// Every purchase of the selected card, in any month (specs/todas-as-compras.md): edit and delete
// follow the rules of each kind. Creating is only through the footer "+" (D9).
export default function Compras() {
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
  const confirm = useConfirm();
  const askDelete = (label: string) => confirm(removeAsk(label));
  const { notice, notify, failed, formError } = useNotice(Boolean(dialog));

  const refresh = () => {
    for (const queryKey of [getGetCardsQueryKey(), getGetCardQueryKey(), getGetConsolidatedHistoryQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], getGetMonthHistoryQueryKey(), ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const saved = (text: string) => ({ mutation: { onSuccess: () => { refresh(); setDialog(null); notify(text); }, onError: failed } });
  const removed = (text: string) => ({ mutation: { onSuccess: () => { refresh(); notify(text); }, onError: failed } });
  const updateMovement = useUpdateMovement(saved('Compra atualizada.'));
  const updatePurchase = useUpdatePurchase(saved('Compra parcelada atualizada.'));
  const updateRecurring = useUpdateRecurring(saved('Compra recorrente atualizada.'));
  const deleteMovement = useDeleteMovement(removed('Compra excluída.'));
  const deletePurchase = useDeletePurchase(removed('Compra parcelada removida.'));
  const deleteRecurring = useDeleteRecurring(removed('Compra recorrente removida.'));
  const busy = updateMovement.isPending || updatePurchase.isPending || updateRecurring.isPending;

  const rows: Row[] = [
    ...(all.data?.movements ?? []).map((movement): Row => ({ key: `m${movement.id}`, description: movement.description, date: movement.date, amount: movement.amount, categoryId: movement.categoryId, categoryName: movement.categoryName, installment: movement.installment, installmentCount: movement.purchase?.installmentCount ?? movement.installmentCount, recurring: movement.recurringId !== undefined, movement })),
    ...(all.data?.planned ?? []).map((planned): Row => ({ key: `p${planned.kind}${planned.purchaseId ?? planned.recurringId}-${planned.installment ?? 0}`, description: planned.description, date: planned.date, amount: planned.amount, categoryId: planned.categoryId, categoryName: planned.categoryName, installment: planned.installment, installmentCount: planned.installmentCount, recurring: planned.kind === 'recurring', planned })),
  ];
  const term = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => (category === 'all' || (category === 'none' ? row.categoryId === null : row.categoryId === Number(category))) && (!term || row.description.toLowerCase().includes(term)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
  const groups = [...new Set(visible.map((row) => monthOf(row.date)))].map((month) => ({ month, rows: visible.filter((row) => monthOf(row.date) === month) }));

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
    else if (planned.purchase) void removePurchase(planned.purchase.id, planned.description);
  };
  const removePurchase = async (purchaseId: number, description: string) => {
    if (await askDelete(`a compra parcelada “${description}” e todas as suas parcelas`)) deletePurchase.mutate({ purchaseId });
  };
  const removeMovement = async (movement: Movement) => {
    if (movement.recurring) setScopeAsk({ action: 'delete', charge: chargeOfMovement(movement)! });
    else if (movement.purchase) await removePurchase(movement.purchase.id, movement.description);
    else if (await askDelete(`a compra “${movement.description}”`)) deleteMovement.mutate({ movementId: movement.id });
  };
  const chooseScope = async (scope: 'month' | 'forward') => {
    if (!scopeAsk) return;
    const { action, charge } = scopeAsk;
    const chargeMonth = monthOf(charge.date);
    setScopeAsk(null);
    if (action === 'edit') { setDialog(chargeDialog(charge, scope)); return; }
    const what = scope === 'month' ? `“${charge.description}” só em ${monthLabel(chargeMonth)}` : `“${charge.description}” de ${monthLabel(chargeMonth)} em diante`;
    if (await askDelete(what)) deleteRecurring.mutate({ recurringId: charge.recurringId, month: chargeMonth, scope });
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
      <BackButton onClick={() => navigate('/')}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <p className="font-mono-data text-xs uppercase tracking-[.08em] text-eyebrow">{card?.name ?? 'Cartão'} · Todos os meses</p>
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">Todas as compras</h1>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block"><Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"/><input data-testid="input-search" aria-label="Buscar compra" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pela descrição" className="field-input rounded-full pl-10"/></label>
        <select data-testid="select-category" aria-label="Filtrar por categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="field-input w-auto rounded-full">
          <option value="all">Todas as categorias</option>
          <option value="none">Sem categoria</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {cardsQuery.isLoading || all.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-line"/><div className="h-16 rounded-2xl bg-line"/></div>
      : cardsQuery.isError || all.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as compras</h3><button onClick={() => { void cardsQuery.refetch(); void all.refetch(); }} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : groups.length ? <div data-testid="list-all-purchases" className="mt-6 space-y-7">
        {groups.map((group) => <section key={group.month} data-testid={`group-${group.month}`}>
          <div className="flex items-baseline justify-between gap-3 pb-2"><h2 className="font-display text-[22px] text-ink">{capitalize(monthLabel(group.month as MonthKey))}</h2><span data-testid={`total-${group.month}`} className="font-mono-data text-[15px] text-ink">{money(sum(group.rows))}</span></div>
          <ul className="divide-y divide-line border-y border-line">
            {group.rows.map((row) => <li key={row.key} data-testid={row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`} className="flex items-center gap-1">
              <button type="button" aria-label={`Editar ${row.description}`} onClick={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 text-left transition hover:bg-surface">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{row.description}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
                    <span className="flex items-center gap-1"><CalendarDays size={13}/>{dateLabel(row.date)}</span>
                    {row.installment && <span className="rounded-full bg-chip px-2 py-0.5 font-mono-data text-[12px] font-medium text-ink-soft">{row.installment}/{row.installmentCount}</span>}
                    {row.recurring && <span className="rounded-full bg-tint px-2 py-0.5 text-[12px] font-semibold text-brand">Mensal</span>}
                    {row.planned && <span className="rounded-full bg-warn-tint px-2 py-0.5 text-[12px] font-medium text-eyebrow">prevista</span>}
                    {row.categoryName && <span className="truncate rounded-full bg-tint px-2 py-0.5 text-[12px] font-medium text-brand">{row.categoryName}</span>}
                  </span>
                </span>
                <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(row.amount)}</span>
              </button>
              <RowMenu title={row.description} editTestId={`button-edit-${row.key}`} deleteTestId={`button-delete-${row.key}`} onEdit={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} onDelete={() => void (row.movement ? removeMovement(row.movement) : removePlanned(row.planned!))}/>
            </li>)}
          </ul>
        </section>)}
      </div>
      : <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand"><Receipt size={16}/></div><p data-testid="text-purchases-empty" className="mt-3 text-[14px] text-ink-soft">{rows.length ? 'Nenhuma compra encontrada.' : 'Nenhuma compra neste cartão.'}</p></div>}
    </div>

    {dialog && <Dialog key={dialog.id} kind="movement" initial={dialog} month={currentMonth()} categories={categories} busy={busy} error={formError} onClose={() => setDialog(null)} onSave={submit}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.charge.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    <Notice notice={notice}/>
  </main>;
}
