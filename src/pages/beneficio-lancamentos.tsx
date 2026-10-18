import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitRangeQueryKey, getGetBenefitsQueryKey, getGetCategoriesQueryKey,
  useDeleteBenefitSpend, useGetBenefits, useGetCategories, useUpdateBenefitSpend,
  type BenefitSpend,
} from '@workspace/api-client-react';
import { ArrowLeft, CalendarDays, Check, CircleHelp, FilePenLine, Receipt, Trash2 } from 'lucide-react';
import { rememberBenefit, SpendDialog } from '@/pages/beneficios';
import { areaPath, capitalize, dateLabel, money, monthLabel, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

// 'todos' = every spend of the benefit; 'sem' = the ones without category; a number = that category.
export type SpendFilter = 'todos' | 'sem' | number;

// Spends of a benefit in the month (specs/lancamentos-do-beneficio.md): all of them or one
// category's, with edit and delete. Creating is only through the footer "+" (D5).
export default function BeneficioLancamentos({ benefitId, filter, month }: { benefitId: number; filter: SpendFilter; month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const benefits = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month), refetchOnWindowFocus: true } });
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [editing, setEditing] = useState<BenefitSpend | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const benefit = benefits.data?.items.find((item) => item.id === benefitId);
  // Back lands on the benefit this screen belongs to (D6).
  useEffect(() => { rememberBenefit(benefitId); }, [benefitId]);

  const refresh = () => {
    for (const queryKey of [getGetBenefitsQueryKey(), getGetBenefitRangeQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const updateSpend = useUpdateBenefitSpend({ mutation: { onSuccess: () => { refresh(); setEditing(null); notify('Gasto atualizado.'); }, onError: failed } });
  const deleteSpend = useDeleteBenefitSpend({ mutation: { onSuccess: () => { refresh(); notify('Gasto excluído.'); }, onError: failed } });

  const spends = (benefit?.spends ?? []).filter((spend) => filter === 'todos' || (filter === 'sem' ? spend.categoryId === null : spend.categoryId === filter));
  const total = Math.round(spends.reduce((sum, spend) => sum + spend.amount, 0) * 100) / 100;
  const categoryName = filter === 'todos' ? 'Todos os lançamentos' : filter === 'sem' ? 'Sem categoria' : (benefit?.categories.find((row) => row.categoryId === filter)?.name ?? categories.find((c) => c.id === filter)?.name ?? 'Categoria');

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-end border-b border-[#ded8ca] pb-5">
        <button data-testid="button-back" onClick={() => navigate(areaPath('benefits', month))} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><ArrowLeft size={14}/> Voltar</button>
      </header>

      <section className="enter mt-8 flex items-end justify-between gap-3" style={{ animationDelay: '.06s' }}>
        <div className="min-w-0">
          <p className="font-mono-data text-[10px] uppercase tracking-[.2em] text-[#ac8f60]">{benefit?.name ?? 'Benefício'} · {capitalize(monthLabel(month))}</p>
          <h1 data-testid="text-spends-title" className="mt-2 font-display text-[34px] leading-[1.05] tracking-[-.03em] text-[#234638] [overflow-wrap:anywhere] sm:text-[42px]">{categoryName}</h1>
        </div>
        <p data-testid="text-spends-total" className="shrink-0 font-mono-data text-[18px] text-[#a55f50]">{money(total)}</p>
      </section>

      {benefits.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-[#e9e3d7]"/><div className="h-16 rounded-2xl bg-[#e9e3d7]"/></div>
      : benefits.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir os lançamentos.</h3></div>
      : spends.length ? <ul data-testid="list-spends" className="mt-6 space-y-3">
        {spends.map((spend) => <li key={spend.id} data-testid={`row-spend-${spend.id}`} className="flex items-center gap-3 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e4ece2] text-[#52735c]"><Receipt size={17}/></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#2f4a3b]">{spend.description}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[10px] text-[#899186]"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateLabel(spend.date)}</span>{spend.categoryName && <span className="truncate rounded-full bg-[#e4ece2] px-2 py-0.5 text-[9px] font-medium text-[#52735c]">{spend.categoryName}</span>}</p>
          </div>
          <span className="shrink-0 font-mono-data text-[15px] text-[#a55f50]">− {money(spend.amount)}</span>
          <div className="flex shrink-0 items-center">
            <button aria-label={`Editar ${spend.description}`} onClick={() => setEditing(spend)} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><FilePenLine size={15}/></button>
            <button aria-label={`Excluir ${spend.description}`} onClick={() => { if (window.confirm(`Remover o gasto “${spend.description}”? Esta ação não pode ser desfeita.`)) deleteSpend.mutate({ spendId: spend.id }); }} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button>
          </div>
        </li>)}
      </ul>
      : <div className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e8e9df] text-[#63806a]"><Receipt size={16}/></div><p data-testid="text-spends-empty" className="mt-3 text-xs text-[#7d887c]">{filter === 'todos' ? 'Sem lançamentos neste mês.' : 'Sem lançamentos nesta categoria.'}</p></div>}
    </div>

    {editing && benefit && <SpendDialog key={editing.id} month={month} benefit={benefit} spend={editing} categories={categories} busy={updateSpend.isPending} onClose={() => setEditing(null)}
      onSave={(values) => updateSpend.mutate({ spendId: editing.id, categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}
    {toast && <div role="status" data-testid="status-toast" className={`fixed left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
