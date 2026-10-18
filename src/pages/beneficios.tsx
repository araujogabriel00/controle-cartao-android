import { type FormEvent, type MouseEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitRangeQueryKey, getGetBenefitsQueryKey, getGetCategoriesQueryKey,
  useCloseBenefitCategory, useCreateBenefit, useCreateBenefitSpend, useDeleteBenefit, useDeleteBenefitSpend,
  useGetBenefitRange, useGetBenefits, useGetCategories, useReopenBenefitCategory, useUpdateBenefit, useUpdateBenefitSpend,
  type BenefitCategoryRow, type BenefitItem, type BenefitSpend, type Category,
} from '@workspace/api-client-react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, FilePenLine, Plus, Repeat, Tag, Trash2, Utensils, X } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { Progress } from '@/components/progress';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { capitalize, currentMonth, dateLabel, firstDayOf, lastDayOf, money, monthLabel, plural, shiftMonth, today, type MonthKey } from '@/lib/format';

export const benefitPath = (month: MonthKey) => (month === currentMonth() ? '/beneficios' : `/beneficios/mes/${month}`);

type BenefitValues = { name: string; amount: number; firstMonth: MonthKey; from: MonthKey; lastMonth: MonthKey | null; split: { categoryId: number; amount: number }[] };

// RF-04 / RF-05: the first month is fixed once the benefit exists (D6); an edit
// says from which month the new monthly value counts (D4).
function BenefitDialog({ month, benefit, categories, busy, onClose, onSave }: {
  month: MonthKey; benefit?: BenefitItem; categories: Category[]; busy: boolean; onClose: () => void; onSave: (values: BenefitValues) => void;
}) {
  const isEdit = Boolean(benefit);
  const [name, setName] = useState(benefit?.name ?? '');
  const [amount, setAmount] = useState(String(benefit?.amount ?? ''));
  const [firstMonth, setFirstMonth] = useState<string>(benefit?.firstMonth ?? month);
  const [from, setFrom] = useState<string>(month);
  const [lastMonth, setLastMonth] = useState<string>(benefit?.lastMonth ?? '');
  // RF-11: the division by category, one line per category.
  const [lines, setLines] = useState<{ categoryId: string; amount: string }[]>((benefit?.split ?? []).map((i) => ({ categoryId: String(i.categoryId), amount: String(i.amount) })));
  const divided = Math.round(lines.reduce((total, line) => total + (Number(line.amount) || 0), 0) * 100) / 100;
  const rest = Math.round((Number(amount) - divided) * 100) / 100;
  const setLine = (index: number, patch: Partial<{ categoryId: string; amount: string }>) => setLines(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const split = lines.filter((line) => line.categoryId && line.amount).map((line) => ({ categoryId: Number(line.categoryId), amount: Number(line.amount) }));
    onSave({ name, amount: Number(amount), firstMonth, from, lastMonth: lastMonth || null, split });
  };
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className={dialogOverlay} onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <form onSubmit={submit} className={dialogPanel}>
      <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">Saldo mensal</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{isEdit ? 'Editar benefício' : 'Novo benefício'}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
      <label htmlFor="input-benefit-name" className="field-label">Nome</label>
      <input id="input-benefit-name" data-testid="input-benefit-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: VR" className="field-input mb-4"/>
      <label htmlFor="input-benefit-amount" className="field-label">Valor mensal</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input id="input-benefit-amount" data-testid="input-benefit-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-benefit-first-month" className="field-label">Mês inicial</label>
      <input id="input-benefit-first-month" data-testid="input-benefit-first-month" required type="month" disabled={isEdit} value={firstMonth} onChange={(e) => setFirstMonth(e.target.value)} className="field-input mb-4 disabled:opacity-60"/>
      {isEdit && <div className="mb-4"><label htmlFor="input-benefit-from" className="field-label">Vale a partir de</label><input id="input-benefit-from" data-testid="input-benefit-from" required type="month" min={benefit?.firstMonth} value={from} onChange={(e) => setFrom(e.target.value)} className="field-input"/><p className="mt-1.5 text-[10px] text-[#8c9388]">O valor mensal e a divisão novos contam deste mês em diante; os meses anteriores não mudam.</p></div>}
      <label htmlFor="input-benefit-last-month" className="field-label">Mês final (opcional)</label>
      <input id="input-benefit-last-month" data-testid="input-benefit-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input mb-1"/>
      <p className="mb-4 text-[10px] text-[#8c9388]">Deixe em branco para repetir sem data final.</p>
      <div data-testid="section-split" className="mb-6 rounded-2xl border border-[#e6dfd1] bg-[#f4f0e6] p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-[13px] font-semibold text-[#3d5948]">Dividir por categoria</span><button type="button" data-testid="button-add-split" disabled={lines.length >= categories.length} onClick={() => setLines([...lines, { categoryId: '', amount: '' }])} className="flex items-center gap-1 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-3 py-1.5 text-[11px] font-semibold text-[#496754] transition hover:bg-[#eee9dd] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={12}/> Adicionar categoria</button></div>
        {lines.length > 0 && <ul className="mt-3 space-y-2">{lines.map((line, index) => <li key={index} data-testid={`split-line-${index}`} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1"><select aria-label="Categoria da divisão" data-testid={`select-split-category-${index}`} required value={line.categoryId} onChange={(e) => setLine(index, { categoryId: e.target.value })} className="field-input appearance-none py-2 pr-8"><option value="">Categoria</option>{categories.filter((item) => String(item.id) === line.categoryId || !lines.some((other) => other.categoryId === String(item.id))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-[#768579]" size={14}/></div>
          <div className="relative w-28 shrink-0"><span className="absolute left-3 top-2.5 text-xs text-[#7d887d]">R$</span><input aria-label="Valor da divisão" data-testid={`input-split-amount-${index}`} required type="number" min="0.01" step="0.01" value={line.amount} onChange={(e) => setLine(index, { amount: e.target.value })} className="field-input py-2 pl-8"/></div>
          <button type="button" aria-label="Remover categoria da divisão" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="rounded-full p-1.5 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={14}/></button>
        </li>)}</ul>}
        <p data-testid="text-split-rest" className={`mt-3 text-[11px] ${rest < 0 ? 'font-semibold text-[#a55f50]' : 'text-[#6e7a6f]'}`}>{rest < 0 ? `A divisão passa do valor mensal em ${money(-rest)}.` : `Sem categoria: ${money(Number.isFinite(rest) ? rest : 0)}`}</p>
      </div>
      <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button><button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button></div>
    </form>
    </div>
    </div>
  </div>;
}

type SpendValues = { description: string; amount: number; date: string; categoryId: number | null };

// RF-07: the date stays inside the benefit's active period (RN-07).
function SpendDialog({ month, benefit, spend, categories, busy, onClose, onSave }: {
  month: MonthKey; benefit: BenefitItem; spend?: BenefitSpend; categories: Category[]; busy: boolean;
  onClose: () => void; onSave: (values: SpendValues) => void;
}) {
  const isEdit = Boolean(spend);
  const [description, setDescription] = useState(spend?.description ?? '');
  const [amount, setAmount] = useState(String(spend?.amount ?? ''));
  const [categoryId, setCategoryId] = useState(spend?.categoryId ? String(spend.categoryId) : '');
  const [date, setDate] = useState(spend?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ description, amount: Number(amount), date, categoryId: categoryId ? Number(categoryId) : null });
  };
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className={dialogOverlay} onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <form onSubmit={submit} className={dialogPanel}>
      <div className="mb-5 flex items-start justify-between sm:mb-7"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">{benefit.name}</span><h2 className="mt-2 font-display text-[30px] leading-tight text-[#234638]">{isEdit ? 'Editar gasto' : 'Novo gasto'}</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
      <label htmlFor="input-spend-description" className="field-label">O que foi?</label>
      <input id="input-spend-description" data-testid="input-spend-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: almoço" className="field-input mb-4"/>
      <label htmlFor="select-spend-category" className="field-label">Categoria</label>
      <div className="relative mb-4"><select id="select-spend-category" data-testid="select-spend-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none"><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}{benefit.categories.some((row) => row.categoryId === item.id && row.closed) ? ' (fechada)' : ''}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-[#768579]" size={16}/></div>
      <label htmlFor="input-spend-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-3 text-[#7d887d]">R$</span><input id="input-spend-amount" data-testid="input-spend-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-spend-date" className="field-label">Data</label>
      <input id="input-spend-date" data-testid="input-spend-date" required type="date" min={firstDayOf(benefit.firstMonth)} max={benefit.lastMonth ? lastDayOf(benefit.lastMonth) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-6"/>
      <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button><button disabled={busy} type="submit" className="flex-1 rounded-full bg-[#28513f] px-4 py-3 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button></div>
    </form>
    </div>
    </div>
  </div>;
}

export default function Beneficios({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const benefitsQuery = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month), refetchOnWindowFocus: true } });
  const range = useGetBenefitRange({ query: { queryKey: getGetBenefitRangeQueryKey() } }).data;
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [benefitDialog, setBenefitDialog] = useState<{ benefit?: BenefitItem } | null>(null);
  const [spendDialog, setSpendDialog] = useState<{ benefit: BenefitItem; spend?: BenefitSpend } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const items = benefitsQuery.data?.items ?? [];

  // Categories are shared with the cards, so their lists refresh together.
  const refresh = () => {
    for (const queryKey of [getGetBenefitsQueryKey(), getGetBenefitRangeQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const closing = (text: string) => ({ onSuccess: () => { refresh(); setBenefitDialog(null); setSpendDialog(null); notify(text); }, onError: failed });
  const done = (text: string) => ({ onSuccess: () => { refresh(); notify(text); }, onError: failed });
  const createBenefit = useCreateBenefit({ mutation: closing('Benefício criado.') });
  const updateBenefit = useUpdateBenefit({ mutation: closing('Benefício atualizado.') });
  const deleteBenefit = useDeleteBenefit({ mutation: done('Benefício removido.') });
  const createSpend = useCreateBenefitSpend({ mutation: closing('Gasto registrado.') });
  const updateSpend = useUpdateBenefitSpend({ mutation: closing('Gasto atualizado.') });
  const deleteSpend = useDeleteBenefitSpend({ mutation: done('Gasto excluído.') });
  const closeCategory = useCloseBenefitCategory({ mutation: done('Categoria fechada.') });
  const reopenCategory = useReopenBenefitCategory({ mutation: done('Categoria reaberta.') });

  const saveBenefit = (values: BenefitValues) => {
    if (benefitDialog?.benefit) updateBenefit.mutate({ benefitId: benefitDialog.benefit.id, month: values.from, data: { name: values.name, amount: values.amount, lastMonth: values.lastMonth, split: values.split } });
    else createBenefit.mutate({ data: { name: values.name, amount: values.amount, firstMonth: values.firstMonth, lastMonth: values.lastMonth, split: values.split } });
  };
  const saveSpend = (values: SpendValues) => {
    if (!spendDialog) return;
    const data = { description: values.description, amount: values.amount, date: values.date };
    if (spendDialog.spend) updateSpend.mutate({ spendId: spendDialog.spend.id, categoryId: values.categoryId, data });
    else createSpend.mutate({ benefitId: spendDialog.benefit.id, categoryId: values.categoryId, data });
  };
  const removeBenefit = (benefit: BenefitItem) => {
    const spends = benefit.spendCount === 0 ? '' : benefit.spendCount === 1 ? ' e seu 1 gasto' : ` e seus ${benefit.spendCount} gastos`;
    if (window.confirm(`Remover o benefício “${benefit.name}”${spends}? Esta ação não pode ser desfeita.`)) deleteBenefit.mutate({ benefitId: benefit.id });
  };
  // RF-15: closing frees what the category has left, so say how much.
  const closeRow = (benefit: BenefitItem, row: BenefitCategoryRow) => {
    const freed = row.availableAmount > 0 ? ` ${money(row.availableAmount)} que sobram vão para “Sem categoria”.` : '';
    if (row.categoryId !== null && window.confirm(`Fechar “${row.name}” em ${benefit.name}?${freed}`)) closeCategory.mutate({ benefitId: benefit.id, categoryId: row.categoryId, month });
  };

  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const isCurrentMonth = month === currentMonth();
  const busy = createBenefit.isPending || updateBenefit.isPending || createSpend.isPending || updateSpend.isPending;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppTabs/>

      <nav aria-label="Mês" className="enter mt-4 flex items-center justify-between gap-2 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1.5">
        <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(benefitPath(shiftMonth(month, -1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft size={17}/></button>
        <div className="min-w-0 text-center"><p data-testid="text-month" className="truncate font-display text-[17px] text-[#234638]">{capitalize(monthLabel(month))}</p>{!isCurrentMonth && <button data-testid="button-current-month" onClick={() => navigate('/beneficios')} className="text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Voltar para o mês atual</button>}</div>
        <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(benefitPath(shiftMonth(month, 1)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={17}/></button>
      </nav>

      <section className="enter mt-6 flex flex-wrap justify-end gap-2" style={{ animationDelay: '.06s' }}>
        <div className="flex flex-wrap gap-2"><button data-testid="button-categories" onClick={() => navigate('/categorias')} className="flex items-center gap-1.5 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-4 py-3 text-xs font-semibold text-[#496754] transition hover:bg-[#eee9dd]"><Tag size={14}/> Categorias</button><button data-testid="button-new-benefit" onClick={() => setBenefitDialog({})} className="flex items-center gap-2 rounded-full bg-[#28513f] px-5 py-3.5 text-[13px] font-semibold text-[#fffaf0] shadow-[0_8px_18px_-10px_rgba(38,80,61,.7)] transition hover:-translate-y-0.5 hover:bg-[#1f4333]"><Plus size={16}/> Novo benefício</button></div>
      </section>

      {items.length > 0 && <section aria-label="Disponível em todos os benefícios" className="enter mt-6 rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] p-5" style={{ animationDelay: '.08s' }}>
        <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Disponível em todos os benefícios · {capitalize(monthLabel(month))}</p>
        <p data-testid="text-benefits-total" className={`mt-2 font-mono-data text-[28px] [overflow-wrap:anywhere] ${(benefitsQuery.data?.totalAvailable ?? 0) < 0 ? 'text-[#a55f50]' : 'text-[#315944]'}`}>{money(benefitsQuery.data?.totalAvailable)}</p>
      </section>}

      {benefitsQuery.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-40 rounded-2xl bg-[#e9e3d7]"/><div className="h-40 rounded-2xl bg-[#e9e3d7]"/></div>
      : benefitsQuery.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir os benefícios.</h3><button onClick={() => void benefitsQuery.refetch()} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Tentar novamente</button></div>
      : items.length ? <div className="mt-6 space-y-5">
        {items.map((benefit) => <article key={benefit.id} data-testid={`card-benefit-${benefit.id}`} className="enter overflow-hidden rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0]">
          <div className="flex items-center gap-3 border-b border-[#ece6da] px-4 py-3.5 sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]"><Utensils size={17}/></span>
            <p className="flex min-w-0 flex-1 items-center gap-2"><span className="truncate text-[15px] font-semibold text-[#2f4a3b]">{benefit.name}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-semibold text-[#52735c]"><Repeat size={9}/> Mensal</span></p>
            <button data-testid={`button-edit-benefit-${benefit.id}`} aria-label={`Editar ${benefit.name}`} onClick={() => setBenefitDialog({ benefit })} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><FilePenLine size={15}/></button>
            <button data-testid={`button-delete-benefit-${benefit.id}`} aria-label={`Excluir ${benefit.name}`} onClick={() => removeBenefit(benefit)} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:gap-3 sm:p-5">
            {([['Crédito do mês', benefit.amount, 'bg-[#f2eee4] text-[#7c877a]', 'text-[#315944]'], ['Sobra anterior', benefit.carriedAmount, 'bg-[#f2eee4] text-[#7c877a]', benefit.carriedAmount < 0 ? 'text-[#a55f50]' : 'text-[#315944]'], ['Gasto', benefit.spentAmount, 'bg-[#f5e9e1] text-[#927b70]', 'text-[#a55f50]'], ['Disponível', benefit.availableAmount, 'bg-[#e4ece2] text-[#5f7a66]', benefit.availableAmount < 0 ? 'text-[#a55f50]' : 'text-[#315944]']] as const).map(([label, value, box, tone]) =>
              <div key={label} className={`min-w-0 rounded-2xl p-3 ${box}`}><span className="text-[10px]">{label}</span><p data-testid={`text-benefit-${label === 'Disponível' ? 'available' : label === 'Gasto' ? 'spent' : label === 'Sobra anterior' ? 'carried' : 'credit'}-${benefit.id}`} className={`mt-1 font-mono-data text-[13px] [overflow-wrap:anywhere] sm:text-[15px] ${tone}`}>{money(value)}</p></div>)}
          </div>
          <div className="flex items-center gap-3 px-4 sm:px-5"><div className="flex-1"><Progress value={benefit.percentUsed} tone={benefit.percentUsed > 85 ? 'peach' : 'green'}/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(benefit.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>
          {benefit.categories.length > 0 && <div data-testid={`section-categories-${benefit.id}`} className="mt-4 border-t border-[#ece6da] px-4 py-3 sm:px-5">
            <p className="font-mono-data text-[10px] uppercase tracking-[.17em] text-[#9a8d71]">Por categoria</p>
            <ul className="mt-3 space-y-4">{benefit.categories.map((row) => <li key={row.categoryId ?? 'none'} data-testid={`row-category-${benefit.id}-${row.categoryId ?? 'none'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2"><span className="truncate text-[13px] font-semibold text-[#345443]">{row.name ?? 'Sem categoria'}</span>{row.closed && <span className="shrink-0 rounded-full bg-[#e9e5dc] px-2 py-0.5 text-[9px] font-medium text-[#82877e]">Fechada</span>}</span>
                <span className="flex shrink-0 items-center gap-1"><span className={`font-mono-data text-[13px] ${row.availableAmount < 0 ? 'text-[#a55f50]' : 'text-[#315944]'}`}>{money(row.availableAmount)}</span>
                  {row.categoryId !== null && (row.closed
                    ? <button data-testid={`button-reopen-${benefit.id}-${row.categoryId}`} onClick={() => reopenCategory.mutate({ benefitId: benefit.id, categoryId: row.categoryId as number, month })} className="rounded-full px-2 py-1 text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4 hover:bg-[#eee9df]">Reabrir</button>
                    : <button data-testid={`button-close-${benefit.id}-${row.categoryId}`} onClick={() => closeRow(benefit, row)} className="rounded-full px-2 py-1 text-[10px] font-semibold text-[#8c5a4c] underline decoration-[#d8b3a8] underline-offset-4 hover:bg-[#f5e9e1]">Fechar</button>)}</span>
              </div>
              <p className="mt-1 text-[10px] text-[#899186]">sobra {money(row.carriedAmount)} + crédito {money(row.amount)} − gasto {money(row.spentAmount)}{row.releasedAmount !== 0 && <> · <b data-testid={`text-released-${benefit.id}-${row.categoryId}`} className="font-semibold text-[#52735c]">Liberado {money(row.releasedAmount)}</b></>}</p>
              {!row.closed && <div className="mt-2 flex items-center gap-3"><div className="flex-1"><Progress value={row.percentUsed} tone={row.percentUsed > 85 ? 'peach' : 'green'}/></div><span className="w-9 text-right font-mono-data text-[9px] text-[#8c9388]">{Number(row.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div>}
            </li>)}</ul>
          </div>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ece6da] px-4 py-3 sm:px-5"><p className="text-[10px] text-[#899186]">{plural(benefit.spends.length, 'gasto', 'gastos')} neste mês</p><button data-testid={`button-benefit-spend-${benefit.id}`} onClick={() => setSpendDialog({ benefit })} className="flex items-center gap-1.5 rounded-full border border-[#d9d2c4] bg-[#faf7ef] px-3.5 py-2 text-xs font-semibold text-[#496754] transition hover:bg-[#eee9dd]"><Plus size={13}/> Registrar gasto</button></div>
          {benefit.spends.length ? <ul className="divide-y divide-[#ece6da] border-t border-[#ece6da]">
            {benefit.spends.map((spend) => <li key={spend.id} data-testid={`row-spend-${spend.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#3d5948]">{spend.description}</p><p className="mt-1 flex items-center gap-2 text-[10px] text-[#8b9185]"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateLabel(spend.date)}</span>{spend.categoryName && <span className="truncate rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-medium text-[#52735c]">{spend.categoryName}</span>}</p></div>
              <span className="shrink-0 font-mono-data text-[12px] text-[#a36354]">− {money(spend.amount)}</span>
              <button aria-label={`Editar ${spend.description}`} onClick={() => setSpendDialog({ benefit, spend })} className="rounded p-1.5 text-[#7c897e] hover:bg-[#eee9df]"><FilePenLine size={13}/></button>
              <button aria-label={`Excluir ${spend.description}`} onClick={() => { if (window.confirm(`Remover o gasto “${spend.description}”? Esta ação não pode ser desfeita.`)) deleteSpend.mutate({ spendId: spend.id }); }} className="rounded p-1.5 text-[#ad6a5a] hover:bg-[#f4e8e1]"><Trash2 size={13}/></button>
            </li>)}
          </ul> : <p data-testid={`text-no-spends-${benefit.id}`} className="border-t border-[#ece6da] px-4 py-5 text-center text-xs text-[#7d887c] sm:px-5">Sem gastos neste mês.</p>}
        </article>)}
      </div>
      : <div className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><Utensils size={18}/></div><h3 data-testid="text-benefits-empty" className="mt-3 font-display text-[20px] text-[#345443]">Nenhum benefício ainda.</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#7d887c]">Cadastre um vale-refeição, vale-alimentação ou algo parecido para acompanhar o saldo.</p></div>}
    </div>

    {benefitDialog && <BenefitDialog key={benefitDialog.benefit?.id ?? 'new'} month={month} benefit={benefitDialog.benefit} categories={categories} busy={busy} onClose={() => setBenefitDialog(null)} onSave={saveBenefit}/>}
    {spendDialog && <SpendDialog key={`${spendDialog.benefit.id}-${spendDialog.spend?.id ?? 'new'}`} month={month} benefit={spendDialog.benefit} spend={spendDialog.spend} categories={categories} busy={busy} onClose={() => setSpendDialog(null)} onSave={saveSpend}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
