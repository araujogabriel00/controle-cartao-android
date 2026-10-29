import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitRangeQueryKey, getGetBenefitsQueryKey, getGetCategoriesQueryKey,
  useCloseBenefitCategory, useCreateBenefit, useCreateBenefitSpend, useDeleteBenefit, useDeleteBenefitSpend,
  useGetBenefitRange, useGetBenefits, useGetCategories, useReopenBenefitCategory, useUpdateBenefit, useUpdateBenefitSpend,
  type BenefitCategoryRow, type BenefitItem, type BenefitSpend, type Category,
} from '@workspace/api-client-react';
import { Check, ChevronDown, ChevronRight, CircleHelp, MoreHorizontal, Plus, Trash2, TriangleAlert, Utensils, X } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { CardMenu } from '@/components/card-menu';
import { CardPicker } from '@/components/card-picker';
import { ChartLegend } from '@/components/charts/chart-legend';
import { HBars, type HBarRow } from '@/components/charts/hbars';
import { StackedBar } from '@/components/charts/stacked-bar';
import { FormActions, FormSheet, SheetHeader } from '@/components/bottom-sheet';
import { removeAsk, useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { dialogPanel } from '@/lib/dialog-styles';
import { useRememberMonth } from '@/lib/last-month';
import { benefitSpendsPath, firstDayOf, lastDayOf, money, monthLabel, plural, today, type MonthKey } from '@/lib/format';

type BenefitValues = { name: string; amount: number; firstMonth: MonthKey; from: MonthKey; lastMonth: MonthKey | null; split: { categoryId: number; amount: number }[] };

// RF-04 / RF-05: the first month is fixed once the benefit exists (D6); an edit
// says from which month the new monthly value counts (D4).
function BenefitDialog({ month, benefit, categories, busy, error, onClose, onSave }: {
  month: MonthKey; benefit?: BenefitItem; categories: Category[]; busy: boolean; error?: string | null; onClose: () => void; onSave: (values: BenefitValues) => void;
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
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      <SheetHeader kicker="Saldo mensal" title={isEdit ? 'Editar benefício' : 'Novo benefício'} onClose={onClose}/>
      <label htmlFor="input-benefit-name" className="field-label">Nome</label>
      <input id="input-benefit-name" data-testid="input-benefit-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: VR" className="field-input mb-4"/>
      <label htmlFor="input-benefit-amount" className="field-label">Valor mensal</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span><input id="input-benefit-amount" data-testid="input-benefit-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-benefit-first-month" className="field-label">Mês inicial</label>
      <input id="input-benefit-first-month" data-testid="input-benefit-first-month" required type="month" disabled={isEdit} value={firstMonth} onChange={(e) => setFirstMonth(e.target.value)} className="field-input mb-4 disabled:opacity-60"/>
      {isEdit && <div className="mb-4"><label htmlFor="input-benefit-from" className="field-label">Vale a partir de</label><input id="input-benefit-from" data-testid="input-benefit-from" required type="month" min={benefit?.firstMonth} value={from} onChange={(e) => setFrom(e.target.value)} className="field-input"/><p className="mt-1.5 text-[13px] text-ink-mute">O valor mensal e a divisão novos contam deste mês em diante; os meses anteriores não mudam.</p></div>}
      <label htmlFor="input-benefit-last-month" className="field-label">Mês final (opcional)</label>
      <input id="input-benefit-last-month" data-testid="input-benefit-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input mb-1"/>
      <p className="mb-4 text-[13px] text-ink-mute">Deixe em branco para repetir sem data final.</p>
      <div data-testid="section-split" className="mb-6 rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-[13px] font-semibold text-ink">Dividir por categoria</span><button type="button" data-testid="button-add-split" disabled={lines.length >= categories.length} onClick={() => setLines([...lines, { categoryId: '', amount: '' }])} className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"><Plus size={12}/> Adicionar categoria</button></div>
        {lines.length > 0 && <ul className="mt-3 space-y-2">{lines.map((line, index) => <li key={index} data-testid={`split-line-${index}`} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1"><select aria-label="Categoria da divisão" data-testid={`select-split-category-${index}`} required value={line.categoryId} onChange={(e) => setLine(index, { categoryId: e.target.value })} className="field-input appearance-none py-2 pr-8"><option value="">Categoria</option>{categories.filter((item) => String(item.id) === line.categoryId || !lines.some((other) => other.categoryId === String(item.id))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-ink-mute" size={14}/></div>
          <div className="relative w-28 shrink-0"><span className="absolute left-3 top-2.5 text-xs text-ink-mute">R$</span><input aria-label="Valor da divisão" data-testid={`input-split-amount-${index}`} required type="number" min="0.01" step="0.01" value={line.amount} onChange={(e) => setLine(index, { amount: e.target.value })} className="field-input py-2 pl-8"/></div>
          <button type="button" aria-label="Remover categoria da divisão" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="rounded-full p-1.5 text-alert transition hover:bg-alert-tint"><Trash2 size={14}/></button>
        </li>)}</ul>}
        <p data-testid="text-split-rest" className={`mt-3 text-[13px] ${rest < 0 ? 'font-semibold text-alert' : 'text-ink-mute'}`}>{rest < 0 ? `A divisão passa do valor mensal em ${money(-rest)}.` : `Sem categoria: ${money(Number.isFinite(rest) ? rest : 0)}`}</p>
      </div>
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
}

type SpendValues = { description: string; amount: number; date: string; categoryId: number | null };

// RF-07: the date stays inside the benefit's active period (RN-07).
export function SpendDialog({ month, benefit, spend, categories, busy, error, onClose, onSave }: {
  month: MonthKey; benefit: BenefitItem; spend?: BenefitSpend; categories: Category[]; busy: boolean; error?: string | null;
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
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      <SheetHeader kicker={benefit.name} title={isEdit ? 'Editar gasto' : 'Novo gasto'} onClose={onClose}/>
      <label htmlFor="input-spend-description" className="field-label">O que foi?</label>
      <input id="input-spend-description" data-testid="input-spend-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: almoço" className="field-input mb-4"/>
      <label htmlFor="select-spend-category" className="field-label">Categoria</label>
      <div className="relative mb-4"><select id="select-spend-category" data-testid="select-spend-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none"><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}{benefit.categories.some((row) => row.categoryId === item.id && row.closed) ? ' (fechada)' : ''}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 text-ink-mute" size={16}/></div>
      <label htmlFor="input-spend-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span><input id="input-spend-amount" data-testid="input-spend-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-spend-date" className="field-label">Data</label>
      <input id="input-spend-date" data-testid="input-spend-date" required type="date" min={firstDayOf(benefit.firstMonth)} max={benefit.lastMonth ? lastDayOf(benefit.lastMonth) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-6"/>
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
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
  const confirm = useConfirm();
  const { notice, notify, failed, formError } = useNotice(Boolean(benefitDialog));
  const items = benefitsQuery.data?.items ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(lastSelectedBenefit);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const chooseBenefit = (id: number) => { lastSelectedBenefit = id; setSelectedId(id); };
  // specs/redesign-opcao-d-beneficios.md D4/D5: the total is the month's credit plus what was carried over (available = total - spent).
  const total = selected ? selected.amount + selected.carriedAmount : 0;
  const over = selected ? selected.availableAmount < 0 : false;
  // With no benefit at all the range is a single month; otherwise an empty month is outside the benefits' period (D8).
  const noBenefits = !range || range.first === range.last;
  const categoryRows: HBarRow[] = (selected?.categories ?? []).map((row) => ({
    key: String(row.categoryId ?? 'none'), label: row.name ?? 'Sem categoria', amount: row.spentAmount, percent: row.percentUsed,
    tag: row.closed ? 'Fechada' : undefined, noBar: row.closed, alert: row.availableAmount < 0,
    detail: <>Disponível <b className="font-mono-data font-medium text-ink">{money(row.availableAmount)}</b> · sobra {money(row.carriedAmount)} + crédito {money(row.amount)} − gasto {money(row.spentAmount)}{row.releasedAmount !== 0 && <> · <b data-testid={`text-released-${selected?.id}-${row.categoryId}`} className="font-semibold text-brand">Liberado {money(row.releasedAmount)}</b></>}</>,
  }));

  // Categories are shared with the cards, so their lists refresh together.
  const refresh = () => {
    for (const queryKey of [getGetBenefitsQueryKey(), getGetBenefitRangeQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['installments']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
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
  const removeBenefit = async (benefit: BenefitItem) => {
    const spends = benefit.spendCount === 0 ? '' : benefit.spendCount === 1 ? ' e seu 1 gasto' : ` e seus ${benefit.spendCount} gastos`;
    if (await confirm(removeAsk(`o benefício “${benefit.name}”${spends}`))) deleteBenefit.mutate({ benefitId: benefit.id });
  };
  // RF-15: closing frees what the category has left, so say how much.
  const closeRow = async (benefit: BenefitItem, row: BenefitCategoryRow) => {
    const freed = row.availableAmount > 0 ? ` ${money(row.availableAmount)} que sobram vão para “Sem categoria”.` : '';
    if (row.categoryId !== null && await confirm({ title: `Fechar “${row.name}” em ${benefit.name}?`, text: freed.trim() || undefined, confirmLabel: 'Fechar categoria' })) closeCategory.mutate({ benefitId: benefit.id, categoryId: row.categoryId, month });
  };

  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const busy = createBenefit.isPending || updateBenefit.isPending;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppHeader area="benefits" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>




      {benefitsQuery.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-24 rounded-2xl bg-line"/><div className="h-40 rounded-2xl bg-line"/></div>
      : benefitsQuery.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir os benefícios.</h3><button onClick={() => void benefitsQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : <div className="enter mt-5">
        <CardPicker cards={items} selectedId={selected?.id ?? null} onSelect={chooseBenefit} onAdd={() => setBenefitDialog({})} groupLabel="Seus benefícios" itemLabel={(item) => `Benefício ${item.name}`}
          faceTestId="benefit-face" addTestId="button-new-benefit" addText="Novo benefício" addLabel="Novo benefício" dot="var(--color-chart-rose)"/>

        {!selected ? <section data-testid="section-benefit-empty" className="mt-6">
          {noBenefits
            ? <><h2 className="font-display text-[28px] leading-tight text-ink">Nenhum benefício ainda</h2><p data-testid="text-benefits-empty" className="mt-2 text-[15px] text-ink-soft">Nenhum benefício ainda. Crie o primeiro para registrar os gastos.</p></>
            : <><h2 data-testid="text-benefit-no-credit" className="font-display text-[28px] leading-tight text-ink">Sem crédito em {monthLabel(month)}</h2><p className="mt-2 text-[15px] text-ink-soft">Nenhum benefício vale neste mês.</p></>}
        </section> : <>
          <section data-testid={`card-benefit-${selected.id}`} aria-label={selected.name} className="mt-6">
            <p className="text-sm font-medium text-ink-soft">Disponível em {monthLabel(month)}</p>
            <div className="flex items-start justify-between gap-3">
              <p data-testid={`text-benefit-available-${selected.id}`} className={`min-w-0 font-display text-[44px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] min-[380px]:text-[52px] ${over ? 'text-alert' : 'text-ink'}`}>{money(selected.availableAmount)}</p>
              <button data-testid={`button-benefit-menu-${selected.id}`} aria-label="Mais opções do benefício" onClick={() => setMenuBenefit(selected)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover"><MoreHorizontal size={22}/></button>
            </div>
            <p className="mt-1 text-[15px] text-ink-soft">de {money(total)} de crédito · {plural(selected.spends.length, 'lançamento', 'lançamentos')}</p>
          </section>

          <section data-testid="section-credit-use" aria-label="Uso do crédito" className="mt-8">
            <h2 className="font-display text-2xl text-ink">Uso do crédito</h2>
            <p className="mb-3 text-sm text-ink-soft">Gasto e disponível no mês</p>
            <StackedBar spent={selected.spentAmount} total={total}/>
            <ChartLegend items={[{ label: 'Gasto', swatch: 'bg-chart-rose' }, { label: 'Disponível', swatch: 'bg-chart-rose-tint' }]}/>
            {over && <p data-testid="text-benefit-over" className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-alert"><TriangleAlert size={16} className="shrink-0"/>Passou {money(-selected.availableAmount)} do crédito</p>}
            <dl className="mt-4 grid grid-cols-3 gap-2">
              {[{ label: 'Crédito', id: 'credit', value: selected.amount }, { label: 'Gasto', id: 'spent', value: selected.spentAmount }, { label: 'Disponível', id: 'balance', value: selected.availableAmount }].map((column) => <div key={column.id} className="min-w-0">
                <dt className="text-xs text-ink-soft">{column.label}</dt>
                <dd data-testid={`text-benefit-${column.id}-${selected.id}`} className="mt-0.5 font-mono-data text-[15px] [overflow-wrap:anywhere]">{money(column.value)}</dd>
              </div>)}
            </dl>
            <p className="mt-3 text-[13px] text-ink-soft">Sobra anterior <span data-testid={`text-benefit-carried-${selected.id}`} className="font-mono-data text-ink">{money(selected.carriedAmount)}</span> (já somada ao disponível)</p>
          </section>

          {selected.categories.length > 0 && <section data-testid={`section-categories-${selected.id}`} aria-label="Uso por categoria" className="mt-8">
            <h2 className="font-display text-2xl text-ink">Uso por categoria</h2>
            <p className="mb-3 text-sm text-ink-soft">Gasto e quanto do crédito de cada categoria já foi usado</p>
            <HBars fill="bg-chart-rose" label="Uso por categoria" rows={categoryRows}
              rowTestId={(key) => `row-category-${selected.id}-${key}`} openTestId={(key) => `open-category-${selected.id}-${key}`} openLabel={(row) => `Ver lançamentos de ${row.label}`}
              onSelect={(key) => navigate(benefitSpendsPath(selected.id, key === 'none' ? 'sem' : Number(key), month))}
              renderAfter={(row) => {
                const source = selected.categories.find((item) => String(item.categoryId ?? 'none') === row.key);
                if (!source || source.categoryId === null) return null;
                return <div className="flex min-h-11 items-center justify-end">
                  {source.closed
                    ? <button data-testid={`button-reopen-${selected.id}-${source.categoryId}`} onClick={() => reopenCategory.mutate({ benefitId: selected.id, categoryId: source.categoryId as number, month })} className="flex min-h-11 items-center px-1 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Reabrir categoria</button>
                    : <button data-testid={`button-close-${selected.id}-${source.categoryId}`} onClick={() => closeRow(selected, source)} className="flex min-h-11 items-center px-1 text-[14px] font-semibold text-alert underline decoration-alert/40 underline-offset-4">Fechar categoria</button>}
                </div>;
              }}/>
          </section>}

          <button data-testid={`button-all-spends-${selected.id}`} onClick={() => navigate(benefitSpendsPath(selected.id, 'todos', month))} className="mt-6 flex min-h-14 w-full items-center justify-between gap-3 border-y border-line text-left text-[15px] font-semibold text-ink transition hover:bg-surface">Todos os lançamentos ({selected.spends.length})<ChevronRight size={18} className="shrink-0 text-ink-soft"/></button>
        </>}
      </div>}
    </div>

    {menuBenefit && <CardMenu title={menuBenefit.name} editLabel="Editar benefício" deleteLabel="Excluir benefício" editTestId={`button-edit-benefit-${menuBenefit.id}`} deleteTestId={`button-delete-benefit-${menuBenefit.id}`}
      onClose={() => setMenuBenefit(null)} onEdit={() => setBenefitDialog({ benefit: menuBenefit })} onDelete={() => removeBenefit(menuBenefit)}/>}
    {benefitDialog && <BenefitDialog key={benefitDialog.benefit?.id ?? 'new'} month={month} benefit={benefitDialog.benefit} categories={categories} busy={busy} error={formError} onClose={() => setBenefitDialog(null)} onSave={saveBenefit}/>}
    <Notice notice={notice}/>
  </main>;
}
