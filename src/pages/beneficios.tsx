import { type FormEvent, type MouseEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitRangeQueryKey, getGetBenefitsQueryKey, getGetCategoriesQueryKey,
  useCloseBenefitCategory, useCreateBenefit, useCreateBenefitSpend, useDeleteBenefit, useDeleteBenefitSpend,
  useGetBenefitRange, useGetBenefits, useGetCategories, useReopenBenefitCategory, useUpdateBenefit, useUpdateBenefitSpend,
  type BenefitCategoryRow, type BenefitItem, type BenefitSpend, type Category,
} from '@workspace/api-client-react';
import { Check, ChevronDown, ChevronRight, CircleHelp, MoreHorizontal, Plus, Repeat, Trash2, Utensils, X } from 'lucide-react';
import { AppTabs } from '@/components/app-tabs';
import { CardMenu } from '@/components/card-menu';
import { SnapCarousel } from '@/components/snap-carousel';
import { CARD_COLOR_KEYS } from '@/lib/card-colors';
import { MonthNav } from '@/components/month-nav';
import { Progress } from '@/components/progress';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { useRememberMonth } from '@/lib/last-month';
import { benefitSpendsPath, firstDayOf, lastDayOf, money, monthLabel, today, type MonthKey } from '@/lib/format';

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
export function SpendDialog({ month, benefit, spend, categories, busy, onClose, onSave }: {
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

// D6: the selected benefit is kept while the app is open (the page remounts on every month), never saved.
let lastSelectedBenefit: number | null = null;
export const rememberBenefit = (id: number) => { lastSelectedBenefit = id; };

export default function Beneficios({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const benefitsQuery = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month), refetchOnWindowFocus: true } });
  const range = useGetBenefitRange({ query: { queryKey: getGetBenefitRangeQueryKey() } }).data;
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [benefitDialog, setBenefitDialog] = useState<{ benefit?: BenefitItem } | null>(null);
  const [menuBenefit, setMenuBenefit] = useState<BenefitItem | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const items = benefitsQuery.data?.items ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(lastSelectedBenefit);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const chooseBenefit = (id: number) => { lastSelectedBenefit = id; setSelectedId(id); };
  // D7: a benefit has no color of its own; it takes one from the card palette by its number.
  const carouselItems = items.map((benefit) => ({ id: benefit.id, color: CARD_COLOR_KEYS[benefit.id % CARD_COLOR_KEYS.length], name: benefit.name, benefit }));

  // Categories are shared with the cards, so their lists refresh together.
  const refresh = () => {
    for (const queryKey of [getGetBenefitsQueryKey(), getGetBenefitRangeQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const closing = (text: string) => ({ onSuccess: () => { refresh(); setBenefitDialog(null); notify(text); }, onError: failed });
  const done = (text: string) => ({ onSuccess: () => { refresh(); notify(text); }, onError: failed });
  const createBenefit = useCreateBenefit({ mutation: closing('Benefício criado.') });
  const updateBenefit = useUpdateBenefit({ mutation: closing('Benefício atualizado.') });
  const deleteBenefit = useDeleteBenefit({ mutation: done('Benefício removido.') });
  const closeCategory = useCloseBenefitCategory({ mutation: done('Categoria fechada.') });
  const reopenCategory = useReopenBenefitCategory({ mutation: done('Categoria reaberta.') });

  const saveBenefit = (values: BenefitValues) => {
    if (benefitDialog?.benefit) updateBenefit.mutate({ benefitId: benefitDialog.benefit.id, month: values.from, data: { name: values.name, amount: values.amount, lastMonth: values.lastMonth, split: values.split } });
    else createBenefit.mutate({ data: { name: values.name, amount: values.amount, firstMonth: values.firstMonth, lastMonth: values.lastMonth, split: values.split } });
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
  const busy = createBenefit.isPending || updateBenefit.isPending;

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <MonthNav area="benefits" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>
      <AppTabs/>




      {benefitsQuery.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-40 rounded-2xl bg-[#e9e3d7]"/><div className="h-40 rounded-2xl bg-[#e9e3d7]"/></div>
      : benefitsQuery.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir os benefícios.</h3><button onClick={() => void benefitsQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : <div className="enter mt-6">
        <SnapCarousel items={carouselItems} selectedId={selected?.id ?? null} onSelect={chooseBenefit} onAdd={() => setBenefitDialog({})}
          region="Seus benefícios" faceTestId="benefit-face" itemLabel={(item) => `Benefício ${item.name}`}
          add={{ testId: 'button-new-benefit', title: 'Novo benefício', text: items.length ? 'Um saldo que se renova todo mês, com a sobra acumulando.' : 'Nenhum benefício ainda. Crie o primeiro para registrar os gastos.', ariaLabel: 'Novo benefício' }}
          renderFace={(item, active, accent) => {
            const benefit = item.benefit;
            return <>
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="flex items-center gap-1.5 font-mono-data text-[12px] uppercase tracking-[.14em]" style={{ color: accent }}><Repeat size={12}/> Mensal</p><h2 className="mt-1 line-clamp-2 font-display text-[26px] leading-tight [overflow-wrap:anywhere]">{benefit.name}</h2></div>
                <div className={`shrink-0 ${active ? '' : 'invisible'}`}>
                  <button data-testid={`button-benefit-menu-${benefit.id}`} aria-label="Mais opções do benefício" tabIndex={active ? 0 : -1} onClick={() => setMenuBenefit(benefit)} className="grid h-11 w-11 place-items-center rounded-full border border-white/[.28] text-white/90 transition hover:bg-white/10"><MoreHorizontal size={20}/></button>
                </div>
              </div>
              <div className="relative mt-5 min-w-0"><p className="text-[13px] text-[#fffaf0]/[.84]">Disponível em {monthLabel(month)}</p><p data-testid={`text-benefit-available-${benefit.id}`} className="mt-1 font-display text-[42px] leading-[1.15] tracking-[-.03em] [overflow-wrap:anywhere]">{money(benefit.availableAmount)}</p></div>
              <dl className="relative mt-4 flex justify-between gap-1">
                {[{ label: 'Crédito', id: 'credit', value: benefit.amount }, { label: 'Sobra anterior', id: 'carried', value: benefit.carriedAmount }, { label: 'Gasto', id: 'spent', value: benefit.spentAmount }].map((column) => <div key={column.id} className="min-w-0">
                  <dt className="whitespace-nowrap text-[12px] text-[#fffaf0]/[.84]">{column.label}</dt>
                  <dd data-testid={`text-benefit-${column.id}-${benefit.id}`} className="mt-0.5 font-mono-data text-[14px] max-[374px]:text-[13px] whitespace-nowrap">{money(column.value)}</dd>
                </div>)}
              </dl>
              <div className="relative mt-4"><div className="mb-2 flex justify-between text-[13px] text-[#fffaf0]/[.84]"><span>Gasto do mês</span><span className="font-mono-data" style={{ color: accent }}>{Number(benefit.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[.18]"><div className="progress-fill h-full rounded-full" style={{ background: accent, transform: `scaleX(${Math.min(100, Math.max(0, benefit.percentUsed)) / 100})` }}/></div></div>
            </>;
          }}/>
        {selected && <article key={selected.id} data-testid={`card-benefit-${selected.id}`} className="enter mt-3 overflow-hidden rounded-[24px] border border-line bg-surface">
          {selected.categories.length > 0 && <div data-testid={`section-categories-${selected.id}`}>
            <p className="px-5 pb-3 pt-4 font-mono-data text-[12px] uppercase tracking-[.14em] text-eyebrow">Por categoria</p>
            <ul>{selected.categories.map((row) => <li key={row.categoryId ?? 'none'} data-testid={`row-category-${selected.id}-${row.categoryId ?? 'none'}`} className="border-t border-line px-5">
              <button data-testid={`open-category-${selected.id}-${row.categoryId ?? 'none'}`} aria-label={`Ver lançamentos de ${row.name ?? 'Sem categoria'}`} onClick={() => navigate(benefitSpendsPath(selected.id, row.categoryId ?? 'sem', month))} className="flex w-full flex-col gap-1 py-3 text-left">
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2"><span className="truncate text-[15px] font-semibold text-ink">{row.name ?? 'Sem categoria'}</span>{row.closed && <span className="shrink-0 rounded-full bg-[#e9e5dc] px-2 py-0.5 text-[12px] font-medium text-ink-soft">Fechada</span>}<ChevronRight size={16} className="shrink-0 text-ink-soft"/></span>
                  <span className={`shrink-0 font-mono-data text-[15px] ${row.availableAmount < 0 ? 'text-alert' : 'text-ink'}`}>{money(row.availableAmount)}</span>
                </span>
                <span className="block text-[13px] text-ink-soft">sobra {money(row.carriedAmount)} + crédito {money(row.amount)} − gasto {money(row.spentAmount)}{row.releasedAmount !== 0 && <> · <b data-testid={`text-released-${selected.id}-${row.categoryId}`} className="font-semibold text-[#2f5a44]">Liberado {money(row.releasedAmount)}</b></>}</span>
                {!row.closed && <span className="mt-1 flex w-full items-center gap-3"><span className="block flex-1"><Progress value={row.percentUsed} tone={row.percentUsed > 85 ? 'peach' : 'green'}/></span><span className="w-10 text-right font-mono-data text-[13px] text-ink-soft">{Number(row.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span></span>}
              </button>
              {row.categoryId !== null && <div className="flex min-h-11 items-center justify-end">
                {row.closed
                  ? <button data-testid={`button-reopen-${selected.id}-${row.categoryId}`} onClick={() => reopenCategory.mutate({ benefitId: selected.id, categoryId: row.categoryId as number, month })} className="flex min-h-11 items-center px-1 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Reabrir categoria</button>
                  : <button data-testid={`button-close-${selected.id}-${row.categoryId}`} onClick={() => closeRow(selected, row)} className="flex min-h-11 items-center px-1 text-[14px] font-semibold text-alert underline decoration-alert/40 underline-offset-4">Fechar categoria</button>}
              </div>}
            </li>)}</ul>
          </div>}
          <button data-testid={`button-all-spends-${selected.id}`} onClick={() => navigate(benefitSpendsPath(selected.id, 'todos', month))} className={`flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left text-[15px] font-semibold text-ink transition hover:bg-paper ${selected.categories.length > 0 ? 'border-t border-line' : ''}`}>Todos os lançamentos ({selected.spends.length})<ChevronRight size={18} className="shrink-0 text-ink-soft"/></button>
        </article>}
      </div>}
    </div>

    {menuBenefit && <CardMenu title={menuBenefit.name} editLabel="Editar benefício" deleteLabel="Excluir benefício" editTestId={`button-edit-benefit-${menuBenefit.id}`} deleteTestId={`button-delete-benefit-${menuBenefit.id}`}
      onClose={() => setMenuBenefit(null)} onEdit={() => setBenefitDialog({ benefit: menuBenefit })} onDelete={() => removeBenefit(menuBenefit)}/>}
    {benefitDialog && <BenefitDialog key={benefitDialog.benefit?.id ?? 'new'} month={month} benefit={benefitDialog.benefit} categories={categories} busy={busy} onClose={() => setBenefitDialog(null)} onSave={saveBenefit}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
