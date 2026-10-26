import { type FormEvent, useState } from 'react';
import {
  INCOME_KINDS, type BillOccurrence, type Category, type DailyExpense, type IncomeKind, type IncomeOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import { ChevronDown } from 'lucide-react';
import { FormActions, FormSheet, SheetHeader } from '@/components/bottom-sheet';
import { dialogPanel } from '@/lib/dialog-styles';
import { currentMonth, firstDayOf, lastDayOf, monthLabel, shiftMonth, today, type MonthKey } from '@/lib/format';

export const KIND_LABELS: Record<IncomeKind, string> = { salario: 'Salário', prolabore: 'Pró-labore', bonus: 'Bônus', outro: 'Outro' };

const dialogHeader = (kicker: string, title: string, onClose: () => void) => <SheetHeader kicker={kicker} title={title} onClose={onClose}/>;

// "Só este mês" edits/deletes apply to a recurring item's single month; the
// form is never opened for a one-off income with a scope (income D7).
export type IncomeForm = { item?: IncomeOccurrence; scope?: IncomeScope };

export function IncomeDialog({ month, item, scope, busy, error, onClose, onSave }: {
  month: MonthKey; item?: IncomeOccurrence; scope?: IncomeScope; busy: boolean; error?: string | null;
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
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Dinheiro que entra', isEdit ? 'Editar entrada' : 'Nova entrada', onClose)}
      <label htmlFor="select-income-kind" className="field-label">Tipo</label>
      <div className="relative mb-4"><select id="select-income-kind" data-testid="select-income-kind" required disabled={onlyThisMonth} value={kind} onChange={(e) => setKind(e.target.value as IncomeKind)} className="field-input appearance-none disabled:opacity-60">{INCOME_KINDS.map((key) => <option key={key} value={key}>{KIND_LABELS[key]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 text-[#768579]" size={16}/></div>
      <label htmlFor="input-income-description" className="field-label">Descrição (opcional)</label>
      <input id="input-income-description" data-testid="input-income-description" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: empresa X" className="field-input mb-4"/>
      <label htmlFor="input-income-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-[#7d887d]">R$</span><input id="input-income-amount" data-testid="input-income-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-income-date" className="field-label">Data</label>
      <input id="input-income-date" data-testid="input-income-date" required type="date" min={insideMonth ? firstDayOf(month) : undefined} max={insideMonth ? lastDayOf(month) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-4"/>
      {!onlyThisMonth && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e6dfd1] bg-[#f4f0e6] px-4 py-3">
        <span id="income-recurring-label" className="text-[13px] font-semibold text-[#3d5948]">Repetir todo mês</span>
        <button type="button" role="switch" data-testid="switch-income-recurring" aria-checked={recurring} aria-labelledby="income-recurring-label" onClick={() => setRecurring(!recurring)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${recurring ? 'bg-[#28513f]' : 'bg-[#cfc8b9]'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${recurring ? 'left-[22px]' : 'left-0.5'}`}/></button>
      </div>}
      {!onlyThisMonth && recurring && <div className="mb-4"><label htmlFor="input-income-last-month" className="field-label">Até (mês, opcional)</label><input id="input-income-last-month" data-testid="input-income-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/><p className="mt-1.5 text-[13px] text-[#8c9388]">Deixe em branco para repetir sem data final.</p></div>}
      {onlyThisMonth && <p className="mb-4 rounded-xl bg-[#f5e9e1] px-3 py-2 text-[13px] leading-5 text-[#8c5a4c]">A mudança vale só para {monthLabel(month)}.</p>}
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
}

export type BillForm = { item?: BillOccurrence; scope?: IncomeScope };
export type BillValues = { name: string; amount: number; date: string; lastMonth: MonthKey | null };

// RF-05: a fixed bill always repeats, so the form has no repeat switch (D2).
export function BillDialog({ month, item, scope, busy, error, onClose, onSave }: {
  month: MonthKey; item?: BillOccurrence; scope?: IncomeScope; busy: boolean; error?: string | null; onClose: () => void; onSave: (values: BillValues) => void;
}) {
  const isEdit = Boolean(item);
  const onlyThisMonth = scope === 'month';
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [date, setDate] = useState(item?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const [lastMonth, setLastMonth] = useState<string>(item?.lastMonth ?? '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ name, amount: Number(amount), date, lastMonth: lastMonth || null });
  };
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Se repete todo mês', isEdit ? 'Editar conta fixa' : 'Nova conta fixa', onClose)}
      <label htmlFor="input-bill-name" className="field-label">Nome</label>
      <input id="input-bill-name" data-testid="input-bill-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: aluguel" className="field-input mb-4"/>
      <label htmlFor="input-bill-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-[#7d887d]">R$</span><input id="input-bill-amount" data-testid="input-bill-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-bill-date" className="field-label">Data</label>
      <input id="input-bill-date" data-testid="input-bill-date" required type="date" min={isEdit ? firstDayOf(month) : undefined} max={isEdit ? lastDayOf(month) : undefined} value={date} onChange={(e) => setDate(e.target.value)} className="field-input"/>
      {!isEdit && <p className="mb-4 mt-1.5 text-[13px] text-[#8c9388]">O dia e o mês inicial da conta saem desta data.</p>}
      {isEdit && <div className="mb-4"/>}
      {!onlyThisMonth && <div className="mb-4"><label htmlFor="input-bill-last-month" className="field-label">Até (mês, opcional)</label><input id="input-bill-last-month" data-testid="input-bill-last-month" type="month" value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} className="field-input"/><p className="mt-1.5 text-[13px] text-[#8c9388]">Deixe em branco para repetir sem data final.</p></div>}
      {onlyThisMonth && <p className="mb-4 rounded-xl bg-[#f5e9e1] px-3 py-2 text-[13px] leading-5 text-[#8c5a4c]">A mudança vale só para {monthLabel(month)}.</p>}
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
}

export type DailyValues = { description: string; amount: number; date: string; categoryId: number | null };

// RF-07: the date is free up to a year ahead (D8); the category is optional.
export function DailyDialog({ month, item, categories, busy, error, onClose, onSave }: {
  month: MonthKey; item?: DailyExpense; categories: Category[]; busy: boolean; error?: string | null; onClose: () => void; onSave: (values: DailyValues) => void;
}) {
  const isEdit = Boolean(item);
  const [description, setDescription] = useState(item?.description ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [categoryId, setCategoryId] = useState(item?.categoryId ? String(item.categoryId) : '');
  const [date, setDate] = useState(item?.date ?? (today().slice(0, 7) === month ? today() : firstDayOf(month)));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ description, amount: Number(amount), date, categoryId: categoryId ? Number(categoryId) : null });
  };
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      {dialogHeader('Gasto do dia a dia', isEdit ? 'Editar gasto' : 'Novo gasto', onClose)}
      <label htmlFor="input-daily-description" className="field-label">O que foi?</label>
      <input id="input-daily-description" data-testid="input-daily-description" required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: feira" className="field-input mb-4"/>
      <label htmlFor="select-daily-category" className="field-label">Categoria</label>
      <div className="relative mb-4"><select id="select-daily-category" data-testid="select-daily-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input appearance-none"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 text-[#768579]" size={16}/></div>
      <label htmlFor="input-daily-amount" className="field-label">Valor</label>
      <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-[#7d887d]">R$</span><input id="input-daily-amount" data-testid="input-daily-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
      <label htmlFor="input-daily-date" className="field-label">Data</label>
      <input id="input-daily-date" data-testid="input-daily-date" required type="date" max={lastDayOf(shiftMonth(currentMonth(), 12))} value={date} onChange={(e) => setDate(e.target.value)} className="field-input mb-6"/>
      <FormActions busy={busy} isEdit={isEdit} onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
}

