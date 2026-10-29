import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBenefitRangeQueryKey, getGetBenefitsQueryKey, getGetCategoriesQueryKey,
  useDeleteBenefitSpend, useGetBenefits, useGetCategories, useUpdateBenefitSpend,
  type BenefitSpend,
} from '@workspace/api-client-react';
import { CalendarDays, CircleHelp, Receipt } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { removeAsk, useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { rememberBenefit, SpendDialog } from '@/pages/beneficios';
import { areaPath, capitalize, dateLabel, money, monthLabel, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

// 'todos' = every spend of the benefit; 'sem' = the ones without category; a number = that category.
export type SpendFilter = 'todos' | 'sem' | number;

// Spends of a benefit in the month (specs/lancamentos-do-beneficio.md): all of them or one
// category's, with edit and delete. Creating is only through the footer "+" (D5).
// Visual da Opção D (specs/redesign-opcao-d-telas-de-apoio.md D1, D2): voltar, título de 28 px, total em destaque e linhas com hairline.
export default function BeneficioLancamentos({ benefitId, filter, month }: { benefitId: number; filter: SpendFilter; month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const confirm = useConfirm();
  const benefits = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month), refetchOnWindowFocus: true } });
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [editing, setEditing] = useState<BenefitSpend | null>(null);
  const { notice, notify, failed, formError } = useNotice(Boolean(editing));
  const benefit = benefits.data?.items.find((item) => item.id === benefitId);
  // Back lands on the benefit this screen belongs to (D6).
  useEffect(() => { rememberBenefit(benefitId); }, [benefitId]);

  const refresh = () => {
    for (const queryKey of [getGetBenefitsQueryKey(), getGetBenefitRangeQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const updateSpend = useUpdateBenefitSpend({ mutation: { onSuccess: () => { refresh(); setEditing(null); notify('Gasto atualizado.'); }, onError: failed } });
  const deleteSpend = useDeleteBenefitSpend({ mutation: { onSuccess: () => { refresh(); notify('Gasto excluído.'); }, onError: failed } });
  const removeSpend = async (spend: BenefitSpend) => {
    if (await confirm(removeAsk(`o gasto “${spend.description}”`))) deleteSpend.mutate({ spendId: spend.id });
  };

  const spends = (benefit?.spends ?? []).filter((spend) => filter === 'todos' || (filter === 'sem' ? spend.categoryId === null : spend.categoryId === filter));
  const total = Math.round(spends.reduce((sum, spend) => sum + spend.amount, 0) * 100) / 100;
  const categoryName = filter === 'todos' ? 'Todos os lançamentos' : filter === 'sem' ? 'Sem categoria' : (benefit?.categories.find((row) => row.categoryId === filter)?.name ?? categories.find((c) => c.id === filter)?.name ?? 'Categoria');

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => navigate(areaPath('benefits', month))}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <p className="font-mono-data text-xs uppercase tracking-[.08em] text-eyebrow">{benefit?.name ?? 'Benefício'} · {capitalize(monthLabel(month))}</p>
        <h1 data-testid="text-spends-title" className="mt-1 font-display text-[28px] leading-tight text-ink [overflow-wrap:anywhere]">{categoryName}</h1>
        <p data-testid="text-spends-total" className="mt-2 font-mono-data text-[28px] leading-tight text-ink">{money(total)}</p>
      </section>

      {benefits.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-line"/><div className="h-16 rounded-2xl bg-line"/></div>
      : benefits.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir os lançamentos.</h3><button onClick={() => void benefits.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : spends.length ? <ul data-testid="list-spends" className="mt-5 divide-y divide-line border-y border-line">
        {spends.map((spend) => <li key={spend.id} data-testid={`row-spend-${spend.id}`} className="flex items-center gap-1">
          <button type="button" aria-label={`Editar ${spend.description}`} onClick={() => setEditing(spend)} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 text-left transition hover:bg-surface">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-ink">{spend.description}</span>
              <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft"><span className="flex items-center gap-1"><CalendarDays size={13}/>{dateLabel(spend.date)}</span>{spend.categoryName && <span className="truncate rounded-full bg-tint px-2 py-0.5 text-[12px] font-medium text-brand">{spend.categoryName}</span>}</span>
            </span>
            <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(spend.amount)}</span>
          </button>
          <RowMenu title={spend.description} editTestId={`button-edit-spend-${spend.id}`} deleteTestId={`button-delete-spend-${spend.id}`} onEdit={() => setEditing(spend)} onDelete={() => void removeSpend(spend)}/>
        </li>)}
      </ul>
      : <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand"><Receipt size={16}/></div><p data-testid="text-spends-empty" className="mt-3 text-[14px] text-ink-soft">{filter === 'todos' ? 'Sem lançamentos neste mês.' : 'Sem lançamentos nesta categoria.'}</p></div>}
    </div>

    {editing && benefit && <SpendDialog key={editing.id} month={month} benefit={benefit} spend={editing} categories={categories} busy={updateSpend.isPending} error={formError} onClose={() => setEditing(null)}
      onSave={(values) => updateSpend.mutate({ spendId: editing.id, categoryId: values.categoryId, data: { description: values.description, amount: values.amount, date: values.date } })}/>}
    <Notice notice={notice}/>
  </main>;
}
