import { type FormEvent, type MouseEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  INCOME_KINDS, getGetIncomeRangeQueryKey, getGetIncomesQueryKey,
  useCreateIncome, useDeleteIncome, useGetIncomeRange, useGetIncomes, useUpdateIncome,
  type IncomeKind, type IncomeOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, HandCoins, Pencil, Plus, Repeat, Trash2, WalletCards, X } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { capitalize, currentMonth, dateLabel, firstDayOf, lastDayOf, money, monthLabel, shiftMonth, today, type MonthKey } from '@/lib/format';

const KIND_LABELS: Record<IncomeKind, string> = { salario: 'Salário', prolabore: 'Pró-labore', bonus: 'Bônus', outro: 'Outro' };

export const incomePath = (month: MonthKey) => (month === currentMonth() ? '/entradas' : `/entradas/mes/${month}`);

// "Só este mês" edits/deletes apply to a recurring income's single month; the
// form is never opened for a one-off income with a scope (D7).
type FormState = { item?: IncomeOccurrence; scope?: IncomeScope };

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
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className="fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]" onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <form onSubmit={submit} className="enter m-auto w-full max-w-[440px] rounded-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-6 shadow-[0_30px_80px_-30px_rgba(22,50,40,.4)] sm:p-8">
      <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">Dinheiro que entra</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{isEdit ? 'Editar entrada' : 'Nova entrada'}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
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
      <div className="mt-2 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button><button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button></div>
    </form>
    </div>
    </div>
  </div>;
}

// D7: asked before editing or deleting an occurrence of a recurring income.
function ScopeDialog({ action, month, onChoose, onClose }: {
  action: 'edit' | 'delete'; month: MonthKey; onChoose: (scope: IncomeScope) => void; onClose: () => void;
}) {
  const verb = action === 'edit' ? 'Editar' : 'Excluir';
  return <div className="fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]">
    <div className="h-full overflow-y-auto overscroll-contain"><div className="flex min-h-full p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="scope-title" className="enter m-auto w-full max-w-[440px] rounded-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-6 shadow-[0_30px_80px_-30px_rgba(22,50,40,.4)] sm:p-8">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ece2] text-[#52735c]"><Repeat size={22}/></div>
        <h2 id="scope-title" className="font-display text-[26px] leading-tight text-[#234638]">{verb} entrada que se repete</h2>
        <p className="mt-2 text-sm leading-6 text-[#6e7a6f]">O que você quer {action === 'edit' ? 'mudar' : 'remover'}?</p>
        <div className="mt-6 space-y-3">
          <button data-testid="button-scope-month" onClick={() => onChoose('month')} className="w-full rounded-2xl border border-[#e1dbce] bg-[#fffdf7] px-4 py-3 text-left transition hover:bg-[#f4f0e6]"><span className="block text-sm font-semibold text-[#315944]">Só este mês</span><span className="text-[11px] text-[#7c877a]">{capitalize(monthLabel(month))}</span></button>
          <button data-testid="button-scope-forward" onClick={() => onChoose('forward')} className="w-full rounded-2xl border border-[#e1dbce] bg-[#fffdf7] px-4 py-3 text-left transition hover:bg-[#f4f0e6]"><span className="block text-sm font-semibold text-[#315944]">Este e os próximos</span><span className="text-[11px] text-[#7c877a]">De {monthLabel(month)} em diante</span></button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button>
      </div>
    </div></div>
  </div>;
}

export default function Entradas({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const incomes = useGetIncomes(month, { query: { queryKey: getGetIncomesQueryKey(month), refetchOnWindowFocus: true } });
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  const [form, setForm] = useState<FormState | null>(null);
  const [scopeAsk, setScopeAsk] = useState<{ action: 'edit' | 'delete'; item: IncomeOccurrence } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const items = incomes.data?.items ?? [];

  const refresh = () => {
    void client.invalidateQueries({ queryKey: getGetIncomesQueryKey() });
    void client.invalidateQueries({ queryKey: getGetIncomeRangeQueryKey() });
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const createIncome = useCreateIncome({ mutation: { onSuccess: () => { refresh(); setForm(null); notify('Entrada registrada.'); }, onError: failed } });
  const updateIncome = useUpdateIncome({ mutation: { onSuccess: () => { refresh(); setForm(null); notify('Entrada atualizada.'); }, onError: failed } });
  const deleteIncome = useDeleteIncome({ mutation: { onSuccess: () => { refresh(); notify('Entrada removida.'); }, onError: failed } });

  const label = (item: IncomeOccurrence) => item.description || KIND_LABELS[item.kind];
  const confirmDelete = (item: IncomeOccurrence, scope: IncomeScope) => {
    const what = item.recurring ? (scope === 'month' ? `“${label(item)}” só em ${monthLabel(month)}` : `“${label(item)}” de ${monthLabel(month)} em diante`) : `“${label(item)}”`;
    if (window.confirm(`Remover ${what}? Esta ação não pode ser desfeita.`)) deleteIncome.mutate({ incomeId: item.incomeId, month, scope });
  };
  const askEdit = (item: IncomeOccurrence) => (item.recurring ? setScopeAsk({ action: 'edit', item }) : setForm({ item }));
  const askDelete = (item: IncomeOccurrence) => (item.recurring ? setScopeAsk({ action: 'delete', item }) : confirmDelete(item, 'forward'));
  const chooseScope = (scope: IncomeScope) => {
    if (!scopeAsk) return;
    const { action, item } = scopeAsk;
    setScopeAsk(null);
    if (action === 'edit') setForm({ item, scope });
    else confirmDelete(item, scope);
  };
  const save: Parameters<typeof IncomeDialog>[0]['onSave'] = (values) => {
    if (form?.item) updateIncome.mutate({ incomeId: form.item.incomeId, month, scope: form.scope ?? 'forward', data: values });
    else createIncome.mutate({ data: values });
  };

  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const isCurrentMonth = month === currentMonth();

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-between border-b border-[#ded8ca] pb-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#28513f] text-[#f4d48b]"><WalletCards size={20}/></div><div><p className="font-display text-[20px] font-semibold leading-none text-[#234638]">controle<span className="text-[#d78470]">.</span></p><p className="mt-1 font-mono-data text-[9px] uppercase tracking-[.19em] text-[#758075]">do cartão</p></div></div>
      </header>
      <AppTabs/>

      <nav aria-label="Mês" className="enter mt-4 flex items-center justify-between gap-2 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1.5">
        <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(incomePath(shiftMonth(month, -1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft size={17}/></button>
        <div className="min-w-0 text-center"><p data-testid="text-month" className="truncate font-display text-[17px] text-[#234638]">{capitalize(monthLabel(month))}</p>{!isCurrentMonth && <button data-testid="button-current-month" onClick={() => navigate('/entradas')} className="text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Voltar para o mês atual</button>}</div>
        <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(incomePath(shiftMonth(month, 1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={17}/></button>
      </nav>

      <section className="enter mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end" style={{ animationDelay: '.06s' }}>
        <div><p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#9a8d71]">Dinheiro que entra</p><h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[54px]">Suas <em className="font-medium text-[#d78470]">entradas.</em></h1></div>
        <button data-testid="button-new-income" onClick={() => setForm({})} className="flex w-fit items-center gap-2 rounded-full bg-[#28513f] px-5 py-3.5 text-[13px] font-semibold text-[#fffaf0] shadow-[0_8px_18px_-10px_rgba(38,80,61,.7)] transition hover:-translate-y-0.5 hover:bg-[#1f4333]"><Plus size={16}/> Nova entrada</button>
      </section>

      <section aria-label="Total do mês" className="enter mt-6 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-5" style={{ animationDelay: '.08s' }}>
        <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Total · {capitalize(monthLabel(month))}</p>
        <p data-testid="text-income-total" className="mt-2 font-mono-data text-[28px] text-[#315944] [overflow-wrap:anywhere]">{money(incomes.data?.totalAmount)}</p>
      </section>

      {incomes.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-[#e9e3d7]"/><div className="h-16 rounded-2xl bg-[#e9e3d7]"/></div>
      : incomes.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir as entradas.</h3><button onClick={() => void incomes.refetch()} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Tentar novamente</button></div>
      : items.length ? <ul data-testid="list-incomes" className="mt-6 space-y-3">
        {items.map((item) => <li key={item.incomeId} data-testid={`row-income-${item.incomeId}`} className="enter flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]"><HandCoins size={17}/></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-[#2f4a3b]">{label(item)}</span>{item.recurring && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span>}</p>
            <p className="mt-0.5 text-[10px] text-[#899186]">{item.description ? `${KIND_LABELS[item.kind]} · ` : ''}{dateLabel(item.date)}</p>
          </div>
          <span className="shrink-0 font-mono-data text-[15px] text-[#315944]">{money(item.amount)}</span>
          <div className="flex shrink-0 items-center">
            <button data-testid={`button-edit-income-${item.incomeId}`} aria-label={`Editar ${label(item)}`} onClick={() => askEdit(item)} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><Pencil size={15}/></button>
            <button data-testid={`button-delete-income-${item.incomeId}`} aria-label={`Excluir ${label(item)}`} onClick={() => askDelete(item)} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
          </div>
        </li>)}
      </ul>
      : <div className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><HandCoins size={18}/></div><h3 data-testid="text-income-empty" className="mt-3 font-display text-[20px] text-[#345443]">Nenhuma entrada neste mês.</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#7d887c]">Registre salário, pró-labore ou bônus para acompanhar o que entra.</p></div>}
    </div>

    {form && <IncomeDialog key={`${form.item?.incomeId ?? 'new'}-${form.scope ?? ''}`} month={month} item={form.item} scope={form.scope} busy={createIncome.isPending || updateIncome.isPending} onClose={() => setForm(null)} onSave={save}/>}
    {scopeAsk && <ScopeDialog action={scopeAsk.action} month={month} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
