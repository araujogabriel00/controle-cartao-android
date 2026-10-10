import { type FormEvent, type MouseEvent, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetCardQueryKey, getGetCategoriesQueryKey, getGetOverviewQueryKey,
  getGetMovementsQueryKey, getGetMonthHistoryQueryKey, getHealthCheckQueryKey, useHealthCheck,
  useGetCard, useGetOverview, useGetCategories, useGetMovements, useGetMonthStatus,
  useCreateCard, useUpdateCard, useDeleteCard, useCreateCategory,
  useUpdateCategory, useDeleteCategory, useSetCategoryClosed,
  useCreateMovement, useUpdateMovement, useDeleteMovement, useStartMonth,
} from '@workspace/api-client-react';
import {
  ArrowDownLeft, ArrowUpRight, BadgeCheck, Banknote, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CreditCard, FilePenLine, FolderClosed, History, LayoutDashboard,
  MoreHorizontal, Plus, RefreshCw, ShieldCheck, Sparkles, Tag,
  Trash2, WalletCards, X,
} from 'lucide-react';
import { Progress } from '@/components/progress';
import {
  capitalize, currentMonth, dateLabel, defaultDateFor, firstDayOf, lastDayOf,
  money, monthLabel, monthName, monthPath, shiftMonth, type MonthKey,
} from '@/lib/format';

type CardRecord = { id: number; name: string; limitAmount: number; usedAmount: number; availableAmount: number; percentUsed: number };
type CategoryRecord = { id: number; name: string; amount: number; usedAmount: number; availableAmount: number; percentUsed: number; isClosed: boolean };
type MovementRecord = { id: number; categoryId: number; description: string; amount: number; date: string };
type DialogKind = 'card' | 'category' | 'movement';
type DialogRecord = { id?: number; categoryId?: number; name?: string; amount?: number; limitAmount?: number; description?: string; date?: string };


function Dialog({ kind, initial, month, categories, busy, onClose, onSave }: {
  kind: DialogKind; initial: DialogRecord; month: MonthKey; categories: CategoryRecord[]; busy: boolean;
  onClose: () => void; onSave: (values: DialogRecord) => void;
}) {
  const [name, setName] = useState(initial.name ?? '');
  const [amount, setAmount] = useState(String(initial.amount ?? initial.limitAmount ?? ''));
  const [description, setDescription] = useState(initial.description ?? '');
  const [date, setDate] = useState(initial.date?.slice(0, 10) ?? defaultDateFor(month));
  const [categoryId, setCategoryId] = useState(String(initial.categoryId ?? categories.find((item) => !item.isClosed)?.id ?? ''));
  const isEdit = Boolean(initial.id);
  const title = kind === 'card' ? (isEdit ? 'Ajustar cartão' : 'Seu cartão') : kind === 'category' ? (isEdit ? 'Editar categoria' : 'Nova categoria') : (isEdit ? 'Editar lançamento' : 'Novo lançamento');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(kind === 'card' ? { name, limitAmount: Number(amount) } : kind === 'category' ? { name, amount: Number(amount) } : { description, amount: Number(amount), date, categoryId: Number(categoryId) });
  };
  // Scrolls (instead of clipping) when the keyboard shrinks the viewport, and stays clear of the system bars.
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className="fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]" onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <form onSubmit={submit} className="enter m-auto w-full max-w-[440px] rounded-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-6 shadow-[0_30px_80px_-30px_rgba(22,50,40,.4)] sm:p-8">
      <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">{kind === 'card' ? 'Visão principal' : kind === 'category' ? 'Planejamento' : 'Registro confirmado'}</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{title}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
      {kind === 'movement' ? <>
        <label className="field-label">Em qual envelope?</label>
        <div className="relative mb-4"><select data-testid="select-movement-category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none">{categories.filter((item) => !item.isClosed || item.id === initial.categoryId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-[#768579]" size={16}/></div>
        <label className="field-label">O que foi?</label><input data-testid="input-movement-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: mercado da semana" className="field-input mb-4"/>
      </> : <>
        <label className="field-label">{kind === 'card' ? 'Nome do cartão' : 'Nome da categoria'}</label><input data-testid={kind === 'card' ? 'input-card-name' : 'input-category-name'} required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'card' ? 'Ex.: Cartão principal' : 'Ex.: Casa e contas'} className="field-input mb-4"/>
      </>}
      <label className="field-label">{kind === 'card' ? 'Limite total' : kind === 'category' ? 'Orçamento planejado' : 'Valor confirmado'}</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input data-testid={kind === 'card' ? 'input-card-limit' : kind === 'category' ? 'input-category-budget' : 'input-movement-amount'} required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      {kind === 'movement' && <><label className="field-label">Data da compra</label><input data-testid="input-movement-date" required type="date" min={firstDayOf(month)} max={lastDayOf(month)} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-6"/></>}
      {kind !== 'movement' && <div className="mb-6"/>}
      <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button><button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button></div>
    </form>
    </div>
    </div>
  </div>;
}

// Asked once per month when there are categories from the last month to reuse.
function MonthStartDialog({ month, previousMonth, busy, onChoose }: {
  month: MonthKey; previousMonth: MonthKey; busy: boolean; onChoose: (copyFrom: MonthKey | null) => void;
}) {
  return <div className="fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]">
    <div className="h-full overflow-y-auto overscroll-contain">
    <div className="flex min-h-full p-4">
    <div role="dialog" aria-modal="true" aria-labelledby="month-start-title" className="enter m-auto w-full max-w-[440px] rounded-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-6 shadow-[0_30px_80px_-30px_rgba(22,50,40,.4)] sm:p-8">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ece2] text-[#52735c]"><CalendarDays size={22}/></div>
      <span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">Novo mês</span>
      <h2 id="month-start-title" className="mt-2 font-display text-[30px] leading-tight text-[#234638]">Começou {monthName(month)}</h2>
      <p className="mt-3 text-sm leading-6 text-[#6e7a6f]">Quer reaproveitar as categorias de {monthName(previousMonth)}? Os orçamentos vêm iguais, abertos e sem lançamentos.</p>
      <div className="mt-6 flex gap-3"><button data-testid="button-month-start-empty" disabled={busy} onClick={() => onChoose(null)} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3] disabled:opacity-60">Começar do zero</button><button data-testid="button-month-start-copy" disabled={busy} onClick={() => onChoose(previousMonth)} className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">Copiar categorias</button></div>
    </div>
    </div>
    </div>
  </div>;
}

export default function Dashboard({ month }: { month: MonthKey }) {
  const client = useQueryClient();
  const [, navigate] = useLocation();
  const isCurrentMonth = month === currentMonth();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1 } });
  const cardQuery = useGetCard(month, { query: { queryKey: getGetCardQueryKey(month), refetchOnWindowFocus: true } });
  const overviewQuery = useGetOverview(month, { query: { queryKey: getGetOverviewQueryKey(month), refetchOnWindowFocus: true } });
  const categoriesQuery = useGetCategories(month, { query: { queryKey: getGetCategoriesQueryKey(month), refetchOnWindowFocus: true } });
  const monthStatus = useGetMonthStatus().data;
  const card = cardQuery.data as CardRecord | null | undefined;
  const categories = (categoriesQuery.data ?? []) as CategoryRecord[];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = categories.find((item) => item.id === selectedId) ?? categories.find((item) => !item.isClosed) ?? categories[0];
  const movementsQuery = useGetMovements(selected?.id ?? 0, { query: { queryKey: getGetMovementsQueryKey(selected?.id ?? 0), enabled: Boolean(selected?.id), refetchOnWindowFocus: true } });
  const movements = (movementsQuery.data ?? []) as MovementRecord[];
  const [filter, setFilter] = useState<'abertos' | 'encerrados'>('abertos');
  const [dialog, setDialog] = useState<{ kind: DialogKind; initial: DialogRecord } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (openMenuId === null) return;
    const closeOnOutsideTap = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest('[data-category-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('pointerdown', closeOnOutsideTap);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap);
  }, [openMenuId]);

  // Prefix keys: refreshes every month, plus the history.
  const refresh = (withMovements = false, categoryId?: number) => {
    void client.invalidateQueries({ queryKey: getGetCardQueryKey() });
    void client.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
    void client.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
    void client.invalidateQueries({ queryKey: getGetMonthHistoryQueryKey() });
    if (withMovements && categoryId) void client.invalidateQueries({ queryKey: getGetMovementsQueryKey(categoryId) });
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  // Validation errors from the store are already written for the user.
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const mutationOptions = { onSuccess: () => { refresh(); setDialog(null); notify('Alterações salvas com cuidado.'); }, onError: failed };
  const createCard = useCreateCard({ mutation: mutationOptions });
  const updateCard = useUpdateCard({ mutation: mutationOptions });
  const deleteCard = useDeleteCard({ mutation: { onSuccess: () => { refresh(); notify('Cartão removido.'); }, onError: failed } });
  const createCategory = useCreateCategory({ mutation: mutationOptions });
  const updateCategory = useUpdateCategory({ mutation: mutationOptions });
  const deleteCategory = useDeleteCategory({ mutation: { onSuccess: () => { refresh(); notify('Envelope removido.'); }, onError: failed } });
  const setCategoryClosed = useSetCategoryClosed({ mutation: { onSuccess: () => { refresh(); notify('Planejamento atualizado.'); }, onError: failed } });
  const createMovement = useCreateMovement({ mutation: { onSuccess: (_result, vars) => { refresh(true, vars.categoryId); setDialog(null); notify('Lançamento confirmado.'); }, onError: failed } });
  const updateMovement = useUpdateMovement({ mutation: { onSuccess: () => { refresh(true, selected?.id); setDialog(null); notify('Lançamento atualizado.'); }, onError: failed } });
  const deleteMovement = useDeleteMovement({ mutation: { onSuccess: (_result, vars) => { refresh(true, selected?.id); notify('Lançamento excluído.'); }, onError: failed } });
  const startMonth = useStartMonth({ mutation: { onSuccess: (_result, vars) => { refresh(); if (vars.copyFrom) notify(`Categorias de ${monthName(vars.copyFrom)} copiadas.`); }, onError: failed } });
  const askMonthStart = isCurrentMonth && Boolean(card) && Boolean(monthStatus?.needsStart && monthStatus.previousHasCategories && monthStatus.previousMonth);
  // Nothing to copy from last month: start the new month empty without asking.
  useEffect(() => {
    if (isCurrentMonth && monthStatus?.needsStart && !monthStatus.previousHasCategories && !startMonth.isPending) startMonth.mutate({ month, copyFrom: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrentMonth, month, monthStatus?.needsStart, monthStatus?.previousHasCategories]);
  const isMutating = createCard.isPending || updateCard.isPending || createCategory.isPending || updateCategory.isPending || createMovement.isPending || updateMovement.isPending;

  const totals = useMemo(() => {
    const spent = categories.reduce((sum, item) => sum + item.usedAmount, 0);
    const planned = categories.filter((item) => !item.isClosed).reduce((sum, item) => sum + item.amount, 0);
    return { spent, planned };
  }, [categories]);
  const visibleCategories = categories.filter((item) => filter === 'abertos' ? !item.isClosed : item.isClosed);
  const loading = cardQuery.isLoading || categoriesQuery.isLoading || overviewQuery.isLoading;
  const overview = overviewQuery.data;

  const submitDialog = (values: DialogRecord) => {
    if (!dialog) return;
    if (dialog.kind === 'card') {
      const data = { name: values.name ?? '', limitAmount: Number(values.limitAmount) };
      if (card) updateCard.mutate({ data }); else createCard.mutate({ data });
    } else if (dialog.kind === 'category') {
      const data = { name: values.name ?? '', amount: Number(values.amount) };
      if (dialog.initial.id) updateCategory.mutate({ categoryId: dialog.initial.id, data }); else createCategory.mutate({ month, data });
    } else {
      const data = { description: values.description ?? '', amount: Number(values.amount), date: values.date ?? defaultDateFor(month) };
      if (dialog.initial.id) updateMovement.mutate({ movementId: dialog.initial.id, data }); else createMovement.mutate({ categoryId: Number(values.categoryId), data });
    }
  };
  const askDelete = (label: string) => window.confirm(`Remover ${label}? Esta ação não pode ser desfeita.`);

  if (loading) return <main className="min-h-safe bg-[#f5f1e7] p-5 sm:p-10"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-5 w-36 rounded bg-[#e5dfd2]"/><div className="mt-8 h-12 w-64 rounded bg-[#e5dfd2]"/><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="h-64 rounded-3xl bg-[#e9e3d7]"/><div className="h-64 rounded-3xl bg-[#e9e3d7]"/></div><div className="mt-6 h-72 rounded-3xl bg-[#e9e3d7]"/></div></main>;
  if (cardQuery.isError || categoriesQuery.isError || overviewQuery.isError) return <main className="flex min-h-safe items-center justify-center bg-[#f5f1e7] p-6"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp/></div><h1 className="mt-5 font-display text-3xl text-[#234638]">Vamos tentar de novo?</h1><p className="mt-3 text-sm leading-6 text-[#758075]">Não conseguimos abrir seu caderno agora. Sua informação continua segura.</p><button onClick={() => { void cardQuery.refetch(); void categoriesQuery.refetch(); void overviewQuery.refetch(); }} className="mt-6 rounded-full bg-[#28513f] px-6 py-3 text-sm font-semibold text-[#fffaf0]">Tentar novamente</button></div></main>;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-12 pt-5 sm:px-8 lg:px-12">
      <header className="enter flex items-center justify-between border-b border-[#ded8ca] pb-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#28513f] text-[#f4d48b]"><WalletCards size={20}/></div><div><p className="font-display text-[20px] font-semibold leading-none text-[#234638]">controle<span className="text-[#d78470]">.</span></p><p className="mt-1 font-mono-data text-[9px] uppercase tracking-[.19em] text-[#758075]">do cartão</p></div></div>
        <div className="hidden items-center gap-2 rounded-full border border-[#ddd7c9] bg-[#f9f6ee] px-3.5 py-2 text-[11px] text-[#64766a] sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-[#d78470]' : 'bg-[#6d9d79]'}`}/>{health.isError ? 'Sincronização pausada' : 'Seu caderno está em dia'}</div>
        <div className="flex items-center gap-2"><button data-testid="button-history" onClick={() => navigate('/historico')} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><History size={14}/><span>Histórico</span></button><button data-testid="button-refresh" aria-label="Atualizar" onClick={() => refresh(true, selected?.id)} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><RefreshCw size={14} className={cardQuery.isFetching ? 'animate-spin' : ''}/><span className="hidden sm:inline">Atualizar</span></button></div>
      </header>

      <nav aria-label="Mês" className="enter mt-5 flex items-center justify-between gap-2 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1.5">
        <button data-testid="button-previous-month" aria-label="Mês anterior" onClick={() => navigate(monthPath(shiftMonth(month, -1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc]"><ChevronLeft size={17}/></button>
        <div className="min-w-0 text-center"><p data-testid="text-month" className="truncate font-display text-[17px] text-[#234638]">{capitalize(monthLabel(month))}</p>{!isCurrentMonth && <button data-testid="button-current-month" onClick={() => navigate('/')} className="text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Voltar para o mês atual</button>}</div>
        <button data-testid="button-next-month" aria-label="Próximo mês" disabled={isCurrentMonth} onClick={() => navigate(monthPath(shiftMonth(month, 1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={17}/></button>
      </nav>

      <section className="enter mt-9 flex flex-col justify-between gap-5 sm:mt-12 sm:flex-row sm:items-end" style={{ animationDelay: '.06s' }}>
        <div><p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#9a8d71]">Seu dinheiro, com intenção</p><h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[54px]">Tudo no seu <em className="font-medium text-[#d78470]">lugar.</em></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#6e7a6f]">Planeje com leveza. Confirme cada gasto. E acompanhe seu cartão sem surpresas.</p></div>
        <button data-testid="button-new-movement" onClick={() => setDialog({ kind: 'movement', initial: {} })} disabled={!categories.some((item) => !item.isClosed)} className="flex w-fit items-center gap-2 rounded-full bg-[#28513f] px-5 py-3.5 text-[13px] font-semibold text-[#fffaf0] shadow-[0_8px_18px_-10px_rgba(38,80,61,.7)] transition hover:-translate-y-0.5 hover:bg-[#1f4333] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16}/> Registrar gasto</button>
      </section>

      {!card ? <section className="enter mt-9 overflow-hidden rounded-[28px] bg-[#28513f] p-7 text-[#fffaf0] sm:p-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center"><div className="max-w-xl"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#f1d68e]"><CreditCard size={22}/></div><p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#d8c991]">Um bom começo</p><h2 className="mt-2 font-display text-3xl sm:text-4xl">Vamos anotar o seu cartão?</h2><p className="mt-3 text-sm leading-6 text-[#d0ded3]">Defina o limite e tenha uma visão mais tranquila do que já está comprometido.</p></div><button data-testid="button-create-card" onClick={() => setDialog({ kind: 'card', initial: {} })} className="flex items-center gap-2 self-start rounded-full bg-[#f0d28b] px-5 py-3 text-sm font-semibold text-[#294438] transition hover:bg-[#f5dfa8]"><Plus size={16}/> Cadastrar cartão</button></div>
      </section> : <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <article className="enter lift relative overflow-hidden rounded-[26px] bg-[#28513f] p-6 text-[#fffaf0] shadow-[0_14px_32px_-24px_rgba(32,70,52,.6)] sm:p-8">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"/><div className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-white/10"/>
          <div className="relative flex items-start justify-between"><div><p className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#d8c991]">Visão do cartão</p><h2 className="mt-2 font-display text-2xl">{card.name}</h2></div><div className="flex gap-2"><button aria-label="Editar cartão" data-testid="button-edit-card" onClick={() => setDialog({ kind: 'card', initial: { id: card.id, name: card.name, limitAmount: card.limitAmount } })} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"><FilePenLine size={15}/></button><button aria-label="Remover cartão" data-testid="button-delete-card" onClick={() => { if (askDelete('o cartão e todos os seus registros')) deleteCard.mutate(); }} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10 hover:text-[#f1b5a5]"><Trash2 size={15}/></button></div></div>
          <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="min-w-0"><p className="text-[11px] text-[#c9d8cb]">Disponível para usar</p><p className="mt-1 font-display text-[clamp(28px,9vw,38px)] leading-tight tracking-[-.03em] [overflow-wrap:anywhere]">{money(card.availableAmount)}</p></div><div className="min-w-0 border-t border-white/15 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><p className="text-[11px] text-[#c9d8cb]">Já comprometido</p><p className="mt-2 font-mono-data text-[20px] text-[#f0d28b] [overflow-wrap:anywhere]">{money(card.usedAmount)}</p></div></div>
          <div className="relative mt-7"><div className="mb-2 flex justify-between text-[10px] text-[#c9d8cb]"><span>Limite utilizado</span><span className="font-mono-data text-[#f0d28b]">{Number(card.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="progress-fill h-full rounded-full bg-[#f0d28b]" style={{ transform: `scaleX(${Math.min(100, Math.max(0, card.percentUsed)) / 100})` }}/></div><p className="mt-2 text-right text-[10px] text-[#c9d8cb]">de {money(card.limitAmount)}</p></div>
          {card.usedAmount === 0 && <p className="relative mt-4 text-[11px] text-[#c9d8cb]">Seu primeiro gasto ainda está por vir. Tudo começa com um registro.</p>}
        </article>
        <article className="enter rounded-[26px] border border-[#e1dbce] bg-[#fbf8f0] p-6 sm:p-8" style={{ animationDelay: '.08s' }}>
          <div className="flex items-center justify-between"><div><p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">O mês em perspectiva</p><h2 className="mt-2 font-display text-[24px] text-[#234638]">{capitalize(monthLabel(month))}</h2></div><div className="grid h-10 w-10 place-items-center rounded-full bg-[#f0e9d9] text-[#587764]"><LayoutDashboard size={17}/></div></div>
          <div className="mt-7 grid grid-cols-2 gap-3"><div className="min-w-0 rounded-2xl bg-[#f2eee4] p-4"><span className="text-[10px] text-[#7c877a]">Orçamentos em aberto</span><p className="mt-2 font-mono-data text-[16px] text-[#315944] [overflow-wrap:anywhere] sm:text-[18px]">{money(overview?.openBudgetAmount ?? totals.planned)}</p></div><div className="min-w-0 rounded-2xl bg-[#f5e9e1] p-4"><span className="text-[10px] text-[#927b70]">Categorias fechadas</span><p className="mt-2 font-mono-data text-[16px] text-[#a55f50] [overflow-wrap:anywhere] sm:text-[18px]">{money(overview?.closedSpentAmount ?? 0)}</p></div></div>
          <div className="mt-5 flex items-center gap-2 border-t border-[#e9e3d8] pt-4 text-[11px] text-[#748075]"><BadgeCheck size={15} className="text-[#668a6d]"/><span><b className="font-semibold text-[#42624d]">{overview?.openCategoryCount ?? categories.filter((c) => !c.isClosed).length} categorias ativas</b> para o que importa {isCurrentMonth ? 'neste mês' : `em ${monthName(month)}`}.</span></div>
        </article>
      </section>}

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
        {/* .enter leaves a transform behind, so each column is its own stacking context;
            lift this one while a menu is open so the aside below can't cover it. */}
        <div className={`enter min-w-0 ${openMenuId !== null ? 'relative z-30' : ''}`} style={{ animationDelay: '.13s' }}>
          <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[#ac8f60]"><Tag size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Planejamento</p></div><h2 className="mt-2 font-display text-[30px] text-[#234638]">Categorias de gastos</h2><p className="mt-1 text-xs text-[#7b8579]">Cada categoria tem seu próprio orçamento.</p></div><button data-testid="button-create-category" disabled={!card} onClick={() => setDialog({ kind: 'category', initial: {} })} className="flex items-center gap-1.5 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-3.5 py-2.5 text-xs font-semibold text-[#496754] transition hover:bg-[#eee9dd] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14}/> Nova categoria</button></div>
          <div className="mt-5 flex gap-1 border-b border-[#ded8ca]"><button data-testid="button-filter-open-categories" onClick={() => setFilter('abertos')} className={`relative px-3 py-2.5 text-xs font-semibold ${filter === 'abertos' ? 'text-[#315944]' : 'text-[#899086]'}`}>Em andamento <span className="ml-1 font-mono-data text-[10px]">{categories.filter((c) => !c.isClosed).length}</span>{filter === 'abertos' && <i className="absolute inset-x-3 bottom-[-1px] h-[2px] rounded-full bg-[#557e68]"/>}</button><button data-testid="button-filter-closed-categories" onClick={() => setFilter('encerrados')} className={`relative px-3 py-2.5 text-xs font-semibold ${filter === 'encerrados' ? 'text-[#315944]' : 'text-[#899086]'}`}>Fechadas <span className="ml-1 font-mono-data text-[10px]">{categories.filter((c) => c.isClosed).length}</span>{filter === 'encerrados' && <i className="absolute inset-x-3 bottom-[-1px] h-[2px] rounded-full bg-[#557e68]"/>}</button></div>
          {categoriesQuery.isFetching && <p className="mt-2 text-[10px] text-[#8a9286]">Atualizando seus envelopes…</p>}
          {visibleCategories.length ? <div className="divide-y divide-[#e5dfd3]">
            {visibleCategories.map((item, index) => <article key={item.id} data-testid={`card-category-${item.id}`} className="group py-4" style={{ animationDelay: `${.03 * index}s` }}>
              <div className="flex items-start justify-between gap-3"><button onClick={() => setSelectedId(item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${item.isClosed ? 'bg-[#ece8df] text-[#8e9185]' : 'bg-[#e4ece2] text-[#52735c]'}`}><FolderClosed size={17}/></span><span className="min-w-0"><span className="flex items-center gap-2 truncate text-[14px] font-semibold text-[#345443]">{item.name}{item.isClosed && <span className="rounded-full bg-[#e9e5dc] px-2 py-0.5 text-[9px] font-medium text-[#82877e]">Encerrado</span>}</span><span className="mt-1 block text-[10px] text-[#899186]">{money(item.usedAmount)} usado de {money(item.amount)}</span></span></button>
                <div className="flex items-center gap-2"><div className="hidden text-right sm:block"><span className="block font-mono-data text-[13px] text-[#315944]">{money(item.availableAmount)}</span><span className="text-[9px] text-[#8c9388]">disponível</span></div><div className="relative"><button data-category-menu aria-label={`Ações para ${item.name}`} aria-expanded={openMenuId === item.id} className="rounded-full p-2 text-[#829084] transition hover:bg-[#ebe7de]" onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}><MoreHorizontal size={17}/></button>{openMenuId === item.id && <><div data-category-menu className={`absolute right-0 z-30 min-w-40 rounded-xl border border-[#e2dccf] bg-[#fffdf7] p-1 shadow-lg ${index === visibleCategories.length - 1 && index > 0 ? 'bottom-9' : 'top-9'}`}><button onClick={() => { setOpenMenuId(null); setDialog({ kind: 'category', initial: { id: item.id, name: item.name, amount: item.amount } }); }} className="menu-action"><FilePenLine size={14}/> Editar categoria</button><button onClick={() => { setOpenMenuId(null); setCategoryClosed.mutate({ categoryId: item.id, data: { isClosed: !item.isClosed } }); }} className="menu-action">{item.isClosed ? <RefreshCw size={14}/> : <Check size={14}/>} {item.isClosed ? 'Reabrir' : 'Fechar'}</button><button onClick={() => { setOpenMenuId(null); if (askDelete(`a categoria “${item.name}”`)) deleteCategory.mutate({ categoryId: item.id }); }} className="menu-action text-[#a45e50]"><Trash2 size={14}/> Remover</button></div></>}</div></div>
              </div>
               <div className="ml-[52px] mt-3 flex items-center gap-3"><div className="flex-1"><Progress value={item.percentUsed} tone={item.isClosed ? 'gold' : item.percentUsed > 85 ? 'peach' : 'green'}/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(item.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>
            </article>)}
          </div> : <div className="mt-4 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><Sparkles size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">{filter === 'abertos' ? 'Uma categoria de cada vez.' : 'Nenhuma categoria fechada.'}</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#7d887c]">{filter === 'abertos' ? 'Crie sua primeira categoria para separar o que já tem destino.' : 'Quando uma categoria terminar, ela ficará guardada aqui.'}</p>{filter === 'abertos' && card && <button onClick={() => setDialog({ kind: 'category', initial: {} })} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Criar minha primeira categoria</button>}</div>}
        </div>

        <aside className="enter min-w-0" style={{ animationDelay: '.18s' }}>
          <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-[#ac8f60]"><Banknote size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Movimentações</p></div><h2 className="mt-2 font-display text-[30px] text-[#234638]">O que já aconteceu</h2></div>{selected && <div className="relative max-w-[145px]"><select value={selected.id} onChange={(e) => setSelectedId(Number(e.target.value))} className="w-full appearance-none truncate rounded-full border border-[#d9d2c4] bg-[#faf7ef] py-2 pl-3 pr-8 text-[10px] font-semibold text-[#496754]">{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-2.5 text-[#758579]"/></div>}</div>
          <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0]">
            {movementsQuery.isLoading ? <div className="space-y-4 p-5"><div className="h-9 animate-pulse rounded bg-[#eee9df]"/><div className="h-9 animate-pulse rounded bg-[#eee9df]"/><div className="h-9 animate-pulse rounded bg-[#eee9df]"/></div> : movements.length ? <div className="divide-y divide-[#ece6da]">
              {(showAll ? movements : movements.slice(0, 5)).map((movement) => <div data-testid={`row-movement-${movement.id}`} key={movement.id} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1e9df] text-[#bb7865]"><ArrowUpRight size={16}/></span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#3d5948]">{movement.description}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-[#8b9185]"><CalendarDays size={11}/>{dateLabel(movement.date)}</p></div><div className="text-right"><p className="font-mono-data text-[12px] text-[#a36354]">− {money(movement.amount)}</p>{!selected?.isClosed && <div className="mt-1 flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button aria-label="Editar lançamento" onClick={() => setDialog({ kind: 'movement', initial: { id: movement.id, categoryId: movement.categoryId, description: movement.description, amount: movement.amount, date: movement.date } })} className="rounded p-1 text-[#7c897e] hover:bg-[#eee9df]"><FilePenLine size={12}/></button><button aria-label="Excluir lançamento" onClick={() => { if (askDelete(`o lançamento “${movement.description}”`)) deleteMovement.mutate({ movementId: movement.id }); }} className="rounded p-1 text-[#ad6a5a] hover:bg-[#f4e8e1]"><Trash2 size={12}/></button></div>}</div></div>)}
              {movements.length > 5 && <button onClick={() => setShowAll(!showAll)} className="w-full border-t border-[#ece6da] py-3 text-[10px] font-semibold text-[#567360] hover:bg-[#f7f3e9]">{showAll ? 'Mostrar menos' : `Ver mais ${movements.length - 5} lançamentos`}</button>}
            </div> : <div className="px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f0eadd] text-[#9b8c69]"><ArrowDownLeft size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Ainda sem lançamentos</h3><p className="mt-1 text-xs leading-5 text-[#7d887c]">{selected ? `Os gastos de “${selected.name}” aparecem aqui assim que você registrar.` : 'Crie uma categoria para começar a registrar seus gastos.'}</p>{selected && !selected.isClosed && <button onClick={() => setDialog({ kind: 'movement', initial: { categoryId: selected.id } })} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Registrar o primeiro gasto</button>}</div>}
            {movementsQuery.isError && <div className="flex items-center justify-between border-t border-[#ece6da] px-5 py-3 text-xs text-[#a45e50]"><span>Não foi possível carregar os lançamentos.</span><button onClick={() => void movementsQuery.refetch()} className="font-semibold underline">Tentar novamente</button></div>}
          </div>
          {card && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e2dccf] bg-[#f0ece2] p-4"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#65806a]"/><p className="text-[10px] leading-5 text-[#778175]">Planejado e confirmado ficam lado a lado. Assim, cada decisão cabe no seu ritmo — sem sustos no fim do mês.</p></div>}
        </aside>
      </section>

      <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-[#ded8ca] pt-4 text-[10px] text-[#919489] sm:flex-row"><span>Um jeito mais gentil de acompanhar o que importa.</span><span className="font-mono-data tracking-wide">CONTROLE DO CARTÃO · 01</span></footer>
    </div>
    {dialog && <Dialog kind={dialog.kind} initial={dialog.initial} month={month} categories={categories} busy={isMutating} onClose={() => setDialog(null)} onSave={submitDialog}/>}
    {askMonthStart && monthStatus?.previousMonth && <MonthStartDialog month={month} previousMonth={monthStatus.previousMonth} busy={startMonth.isPending} onChoose={(copyFrom) => startMonth.mutate({ month, copyFrom })}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}