import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetAllMovementsQueryKey, getGetCardQueryKey, getGetCardsQueryKey, getGetCategoriesQueryKey, getGetConsolidatedHistoryQueryKey, getGetMonthHistoryQueryKey,
  useDeleteMovement, useDeletePurchase, useDeleteRecurring, useGetAllMovements, useGetCards, useGetCategories,
  useUpdateMovement, useUpdatePurchase, useUpdateRecurring,
  type Movement, type PlannedInstallment,
} from '@workspace/api-client-react';
import { ArrowLeft, CalendarDays, Check, CircleHelp, FilePenLine, Receipt, Search, Trash2 } from 'lucide-react';
import { Dialog, type DialogRecord } from '@/pages/dashboard';
import { ScopeDialog } from '@/components/scope-dialog';
import { capitalize, currentMonth, dateLabel, money, monthLabel, monthOf, type MonthKey } from '@/lib/format';

// One line of the list: a registered purchase or a planned installment.
type Row = {
  key: string; description: string; date: string; amount: number; categoryId: number | null; categoryName: string | null;
  installment?: number; installmentCount?: number; recurring?: boolean; movement?: Movement; planned?: PlannedInstallment;
};

const sum = (rows: Row[]) => Math.round(rows.reduce((total, row) => total + row.amount, 0) * 100) / 100;
const askDelete = (label: string) => window.confirm(`Remover ${label}? Esta ação não pode ser desfeita.`);

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
  const [scopeAsk, setScopeAsk] = useState<{ action: 'edit' | 'delete'; movement: Movement } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const refresh = () => {
    for (const queryKey of [getGetCardsQueryKey(), getGetCardQueryKey(), getGetConsolidatedHistoryQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], getGetMonthHistoryQueryKey(), ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
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
    ...(all.data?.planned ?? []).map((planned): Row => ({ key: `p${planned.purchaseId}-${planned.installment}`, description: planned.description, date: planned.date, amount: planned.amount, categoryId: planned.categoryId, categoryName: planned.categoryName, installment: planned.installment, installmentCount: planned.installmentCount, planned })),
  ];
  const term = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => (category === 'all' || (category === 'none' ? row.categoryId === null : row.categoryId === Number(category))) && (!term || row.description.toLowerCase().includes(term)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
  const groups = [...new Set(visible.map((row) => monthOf(row.date)))].map((month) => ({ month, rows: visible.filter((row) => monthOf(row.date) === month) }));

  const editMovement = (movement: Movement) => {
    if (movement.recurring) { setScopeAsk({ action: 'edit', movement }); return; }
    setDialog(movement.purchase
      ? { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.purchase.totalAmount, date: movement.date, isPurchase: true, purchaseId: movement.purchase.id, installmentCount: movement.purchase.installmentCount, installment: movement.installment, firstInstallment: movement.purchase.firstInstallment }
      : { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date });
  };
  const editPlanned = (planned: PlannedInstallment) => planned.purchase && setDialog({
    id: planned.purchase.id, categoryId: planned.categoryId, description: planned.description, amount: planned.purchase.totalAmount, date: planned.date, isPurchase: true, purchaseId: planned.purchase.id,
    installmentCount: planned.purchase.installmentCount, installment: planned.installment, firstInstallment: planned.purchase.firstInstallment,
  });
  const removePurchase = (purchaseId: number, description: string) => {
    if (window.confirm(`Remover a compra parcelada “${description}” e todas as suas parcelas? Esta ação não pode ser desfeita.`)) deletePurchase.mutate({ purchaseId });
  };
  const removeMovement = (movement: Movement) => {
    if (movement.recurring) setScopeAsk({ action: 'delete', movement });
    else if (movement.purchase) removePurchase(movement.purchase.id, movement.description);
    else if (askDelete(`a compra “${movement.description}”`)) deleteMovement.mutate({ movementId: movement.id });
  };
  const chooseScope = (scope: 'month' | 'forward') => {
    if (!scopeAsk?.movement.recurring) return;
    const { action, movement } = scopeAsk;
    const recurring = movement.recurring!;
    const chargeMonth = monthOf(movement.date);
    setScopeAsk(null);
    if (action === 'edit') {
      setDialog({ id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date, isRecurring: true, recurringId: recurring.id, lastMonth: recurring.lastMonth, scope });
      return;
    }
    const what = scope === 'month' ? `“${movement.description}” só em ${monthLabel(chargeMonth)}` : `“${movement.description}” de ${monthLabel(chargeMonth)} em diante`;
    if (askDelete(what)) deleteRecurring.mutate({ recurringId: recurring.id, month: chargeMonth, scope });
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

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-end border-b border-[#ded8ca] pb-5">
        <button data-testid="button-back" onClick={() => navigate('/')} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><ArrowLeft size={14}/> Voltar</button>
      </header>

      <section className="enter mt-8" style={{ animationDelay: '.06s' }}>
        <p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#ac8f60]">{card?.name ?? 'Cartão'} · Todos os meses</p>
        <h1 className="mt-2 font-display text-[34px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[42px]">Todas as compras</h1>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block"><Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9588]"/><input data-testid="input-search" aria-label="Buscar compra" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pela descrição" className="w-full rounded-full border border-[#ded8ca] bg-[#fbf8f0] py-2.5 pl-9 pr-4 text-xs outline-none focus:border-[#7a9a82]"/></label>
        <select data-testid="select-category" aria-label="Filtrar por categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-[#ded8ca] bg-[#fbf8f0] px-4 py-2.5 text-xs outline-none focus:border-[#7a9a82]">
          <option value="all">Todas as categorias</option>
          <option value="none">Sem categoria</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {cardsQuery.isLoading || all.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-[#e9e3d7]"/><div className="h-16 rounded-2xl bg-[#e9e3d7]"/></div>
      : cardsQuery.isError || all.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir as compras</h3></div>
      : groups.length ? <div data-testid="list-all-purchases" className="mt-6 space-y-7">
        {groups.map((group) => <section key={group.month} data-testid={`group-${group.month}`}>
          <div className="flex items-baseline justify-between gap-3 border-b border-[#e1dbce] pb-2"><h2 className="font-display text-[22px] text-[#234638]">{capitalize(monthLabel(group.month as MonthKey))}</h2><span data-testid={`total-${group.month}`} className="font-mono-data text-[14px] text-[#a55f50]">{money(sum(group.rows))}</span></div>
          <ul className="mt-3 space-y-3">
            {group.rows.map((row) => <li key={row.key} data-testid={row.movement ? `row-movement-${row.movement.id}` : `row-planned-${row.key}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]"><Receipt size={17}/></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-[#2f4a3b]"><span className="truncate">{row.description}</span>{row.installment && <span className="shrink-0 rounded-full bg-[#ece6da] px-2 py-0.5 font-mono-data text-[9px] font-medium text-[#6f7a6e]">{row.installment}/{row.installmentCount}</span>}{row.recurring && <span className="shrink-0 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]">Mensal</span>}{row.planned && <span className="shrink-0 rounded-full bg-[#f8efd9] px-2 py-0.5 text-[9px] font-medium text-[#7a6a45]">prevista</span>}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[10px] text-[#899186]"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateLabel(row.date)}</span>{row.categoryName && <span className="truncate rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-medium text-[#52735c]">{row.categoryName}</span>}</p>
              </div>
              <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">− {money(row.amount)}</span>
              <div className="flex shrink-0 items-center">
                <button aria-label={`Editar ${row.description}`} onClick={() => row.movement ? editMovement(row.movement) : editPlanned(row.planned!)} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><FilePenLine size={15}/></button>
                <button aria-label={`Excluir ${row.description}`} onClick={() => row.movement ? removeMovement(row.movement) : removePurchase(row.planned!.purchase!.id, row.description)} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
              </div>
            </li>)}
          </ul>
        </section>)}
      </div>
      : <div className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><Receipt size={16}/></div><p data-testid="text-purchases-empty" className="mt-3 text-xs text-[#7d887c]">{rows.length ? 'Nenhuma compra encontrada.' : 'Nenhuma compra neste cartão.'}</p></div>}
    </div>

    {dialog && <Dialog key={dialog.id} kind="movement" initial={dialog} month={currentMonth()} categories={categories} busy={busy} onClose={() => setDialog(null)} onSave={submit}/>}
    {scopeAsk && <ScopeDialog subject="compra recorrente" action={scopeAsk.action} month={monthOf(scopeAsk.movement.date)} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
