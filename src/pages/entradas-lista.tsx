import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetBillsQueryKey, getGetCategoriesQueryKey, getGetDailyExpensesQueryKey, getGetIncomeRangeQueryKey, getGetIncomesQueryKey, getGetMonthCashQueryKey,
  getGetCardsQueryKey, useDeleteBill, useDeleteDailyExpense, useDeleteIncome, useGetBills, useGetCards, useGetCategories, useGetDailyExpenses, useGetIncomes,
  useSelectCard, useUpdateBill, useUpdateDailyExpense, useUpdateIncome,
  type BillOccurrence, type DailyExpense, type ForecastOccurrence, type IncomeOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import { CalendarClock, CalendarDays, ChevronRight, CircleHelp, CreditCard, HandCoins, Receipt, Repeat, ShoppingBasket } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { HBars } from '@/components/charts/hbars';
import { scopeSuffix, undoable } from '@/components/undo-snackbar';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { BillDialog, DailyDialog, IncomeDialog, KIND_LABELS, type BillForm, type BillValues, type DailyValues, type IncomeForm } from '@/components/entry-dialogs';
import { ScopeDialog } from '@/components/scope-dialog';
import { CARD_COLORS } from '@/lib/card-colors';
import { areaPath, capitalize, dateLabel, forecastDayPath, money, monthLabel, type ListKind, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const emptyBox = (testid: string, icon: React.ReactNode, text: string) => <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand">{icon}</div><p data-testid={testid} className="mt-3 text-[14px] text-ink-soft">{text}</p></div>;

type ScopeAsk = { kind: 'income'; action: 'edit' | 'delete'; item: IncomeOccurrence } | { kind: 'bill'; action: 'edit' | 'delete'; item: BillOccurrence };

const TITLES: Record<ListKind, { kicker: string; title: string }> = {
  'entradas': { kicker: 'Dinheiro que entra', title: 'Entradas' },
  // A lista de sonhos tem tela própria (pages/sonhos-lista.tsx); a entrada fica só para o tipo fechar.
  'sonhos': { kicker: 'Aportes e retiradas', title: 'Guardado em sonhos' },
  'contas-fixas': { kicker: 'Se repetem todo mês', title: 'Contas fixas' },
  'gastos': { kicker: 'Avulsos', title: 'Gastos do dia a dia' },
  'cartoes': { kicker: 'Faturas do mês', title: 'Cartões' },
};

// One screen per summary block of the Entradas tab (specs/telas-de-entradas.md): the list of the
// month with edit and delete. Creating is only through the footer "+" (D5).
export default function EntradasLista({ kind, month }: { kind: ListKind; month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const incomes = useGetIncomes(month, { query: { queryKey: getGetIncomesQueryKey(month), enabled: kind === 'entradas', refetchOnWindowFocus: true } });
  const bills = useGetBills(month, { query: { queryKey: getGetBillsQueryKey(month), enabled: kind === 'contas-fixas', refetchOnWindowFocus: true } });
  const daily = useGetDailyExpenses(month, { query: { queryKey: getGetDailyExpensesQueryKey(month), enabled: kind === 'gastos', refetchOnWindowFocus: true } });
  const cards = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month), enabled: kind === 'cartoes', refetchOnWindowFocus: true } });
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } }).data ?? [];
  const [incomeForm, setIncomeForm] = useState<IncomeForm | null>(null);
  const [billForm, setBillForm] = useState<BillForm | null>(null);
  const [dailyForm, setDailyForm] = useState<{ item?: DailyExpense } | null>(null);
  const [scopeAsk, setScopeAsk] = useState<ScopeAsk | null>(null);
  const { notice, notify, failed, formError } = useNotice(Boolean(incomeForm || billForm || dailyForm));
  const incomeItems = incomes.data?.items ?? [];
  const billItems = bills.data?.items ?? [];
  const dailyItems = daily.data?.items ?? [];
  // D13: as previsões que já entraram no saldo somam nesta linha do caixa e aparecem na lista com a marca "Previsão".
  const forecastIncome = incomes.data?.forecastItems ?? [];
  const forecastBills = bills.data?.forecastItems ?? [];
  const forecastDaily = daily.data?.forecastItems ?? [];

  const refresh = () => {
    for (const queryKey of [getGetIncomesQueryKey(), getGetIncomeRangeQueryKey(), getGetBillsQueryKey(), getGetDailyExpensesQueryKey(), getGetMonthCashQueryKey(), getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['benefits']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const closing = (text: string) => ({ onSuccess: () => { refresh(); setIncomeForm(null); setBillForm(null); setDailyForm(null); notify(text); }, onError: failed });
  // D1: apagar não pergunta; o aviso com Desfazer abre depois (specs/desfazer-exclusao.md).
  const removed = { onSuccess: () => refresh(), onError: failed };
  // D11: a card row opens the Cartões tab, in this month, with that card selected.
  const selectCard = useSelectCard({ mutation: { onSuccess: () => { refresh(); navigate(areaPath('cards', month)); }, onError: failed } });
  const updateIncome = useUpdateIncome({ mutation: closing('Entrada atualizada.') });
  const deleteIncome = useDeleteIncome({ mutation: removed });
  const updateBill = useUpdateBill({ mutation: closing('Conta fixa atualizada.') });
  const deleteBill = useDeleteBill({ mutation: removed });
  const updateDaily = useUpdateDailyExpense({ mutation: closing('Gasto atualizado.') });
  const deleteDaily = useDeleteDailyExpense({ mutation: removed });

  const incomeLabel = (item: IncomeOccurrence) => item.description || KIND_LABELS[item.kind];
  const deleteIncomeNow = (item: IncomeOccurrence, scope: IncomeScope) => {
    const label = incomeLabel(item);
    deleteIncome.mutate({ incomeId: item.incomeId, month, scope }, undoable(label, item.recurring ? `${label} removido${scopeSuffix(scope)}.` : `${label} removido.`));
  };
  const deleteBillNow = (item: BillOccurrence, scope: IncomeScope) => {
    deleteBill.mutate({ billId: item.billId, month, scope }, undoable(item.name, `${item.name} removida${scopeSuffix(scope)}.`));
  };
  const chooseScope = (scope: IncomeScope) => {
    if (!scopeAsk) return;
    const ask = scopeAsk;
    setScopeAsk(null);
    if (ask.kind === 'income') { if (ask.action === 'edit') setIncomeForm({ item: ask.item, scope }); else deleteIncomeNow(ask.item, scope); }
    else if (ask.action === 'edit') setBillForm({ item: ask.item, scope });
    else deleteBillNow(ask.item, scope);
  };
  const saveIncome: Parameters<typeof IncomeDialog>[0]['onSave'] = (values) => {
    if (incomeForm?.item) updateIncome.mutate({ incomeId: incomeForm.item.incomeId, month, scope: incomeForm.scope ?? 'forward', data: values });
  };
  const saveBill = (values: BillValues) => {
    if (billForm?.item) updateBill.mutate({ billId: billForm.item.billId, month, scope: billForm.scope ?? 'forward', data: values });
  };
  const saveDaily = (values: DailyValues) => {
    const data = { description: values.description, amount: values.amount, date: values.date };
    if (dailyForm?.item) updateDaily.mutate({ expenseId: dailyForm.item.id, categoryId: values.categoryId, data });
  };

  const removeDaily = (item: DailyExpense) => {
    deleteDaily.mutate({ expenseId: item.id }, undoable(item.description, `${item.description} removido.`));
  };
  const cardItems = cards.data?.cards ?? [];
  const query = kind === 'entradas' ? incomes : kind === 'contas-fixas' ? bills : kind === 'cartoes' ? cards : daily;
  const total = kind === 'entradas' ? incomes.data?.totalAmount : kind === 'contas-fixas' ? bills.data?.totalAmount : kind === 'cartoes' ? Math.round(cardItems.reduce((sum, card) => sum + card.invoiceAmount, 0) * 100) / 100 : daily.data?.totalAmount;
  const busy = updateIncome.isPending || updateBill.isPending || updateDaily.isPending;
  const { kicker, title } = TITLES[kind];
  const subtitle = 'mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft';
  const tag = 'inline-flex shrink-0 items-center gap-1 rounded-full bg-tint px-2 py-0.5 text-[12px] font-semibold text-brand';
  // Linha de uma previsão que entrou no saldo: sem menu, e tocar abre o dia dela em Previsões (D13).
  const forecastRows = (items: ForecastOccurrence[]) => items.map((item) => <li key={`forecast-${item.forecastId}-${item.month}`} data-testid={`row-forecast-${item.forecastId}`}>
    <button type="button" aria-label={`Previsão ${item.description}. Abrir o dia em Previsões.`} onClick={() => navigate(forecastDayPath(item.date))} className={`${rowButton} w-full`}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{item.description}</span>
        <span className={subtitle}><span className="flex items-center gap-1"><CalendarDays size={13}/>{dateLabel(item.date)}</span><span data-testid="badge-forecast" className={tag}><CalendarClock size={11}/> Previsão</span></span>
      </span>
      <span className={`shrink-0 font-mono-data text-[15px] ${item.kind === 'receive' ? 'text-brand' : 'text-ink'}`}>{item.kind === 'receive' ? money(item.amount) : `− ${money(item.amount)}`}</span>
    </button>
  </li>);
  const rowButton = 'flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 text-left transition hover:bg-surface';

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => navigate(areaPath('income', month))}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <p className="font-mono-data text-xs uppercase tracking-[.08em] text-eyebrow">{kicker} · {capitalize(monthLabel(month))}</p>
        <h1 data-testid="text-list-title" className="mt-1 font-display text-[28px] leading-tight text-ink">{title}</h1>
        <p data-testid="text-list-total" className="mt-2 font-mono-data text-[28px] leading-tight text-ink">{money(total)}</p>
      </section>

      {query.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-16 rounded-2xl bg-line"/><div className="h-16 rounded-2xl bg-line"/></div>
      : query.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir esta lista.</h3><button onClick={() => void query.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : <>
      {kind === 'entradas' && (incomeItems.length + forecastIncome.length ? <ul data-testid="list-incomes" className="mt-5 divide-y divide-line border-y border-line">
        {incomeItems.map((item) => {
          const edit = () => (item.recurring ? setScopeAsk({ kind: 'income', action: 'edit', item }) : setIncomeForm({ item }));
          return <li key={item.incomeId} data-testid={`row-income-${item.incomeId}`} className="flex items-center gap-1">
            <button type="button" aria-label={`Editar ${incomeLabel(item)}`} onClick={edit} className={rowButton}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{incomeLabel(item)}</span>
                <span className={subtitle}>{item.description ? <span>{KIND_LABELS[item.kind]}</span> : null}<span>{dateLabel(item.date)}</span>{item.recurring && <span className={tag}><Repeat size={11}/> Mensal</span>}</span>
              </span>
              <span className="shrink-0 font-mono-data text-[15px] text-brand">{money(item.amount)}</span>
            </button>
            <RowMenu title={incomeLabel(item)} editTestId={`button-edit-income-${item.incomeId}`} deleteTestId={`button-delete-income-${item.incomeId}`} onEdit={edit} onDelete={() => (item.recurring ? setScopeAsk({ kind: 'income', action: 'delete', item }) : void deleteIncomeNow(item, 'forward'))}/>
          </li>;
        })}
        {forecastRows(forecastIncome)}
      </ul> : emptyBox('text-income-empty', <HandCoins size={16}/>, 'Nenhuma entrada neste mês.'))}

      {kind === 'contas-fixas' && (billItems.length + forecastBills.length ? <ul data-testid="list-bills" className="mt-5 divide-y divide-line border-y border-line">
        {billItems.map((item) => <li key={item.billId} data-testid={`row-bill-${item.billId}`} className="flex items-center gap-1">
          <button type="button" aria-label={`Editar ${item.name}`} onClick={() => setScopeAsk({ kind: 'bill', action: 'edit', item })} className={rowButton}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-ink">{item.name}</span>
              <span className={subtitle}><span>dia {Number(item.date.slice(8))}</span><span className={tag}><Repeat size={11}/> Mensal</span></span>
            </span>
            <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(item.amount)}</span>
          </button>
          <RowMenu title={item.name} editTestId={`button-edit-bill-${item.billId}`} deleteTestId={`button-delete-bill-${item.billId}`} onEdit={() => setScopeAsk({ kind: 'bill', action: 'edit', item })} onDelete={() => setScopeAsk({ kind: 'bill', action: 'delete', item })}/>
        </li>)}
        {forecastRows(forecastBills)}
      </ul> : emptyBox('text-bills-empty', <Receipt size={16}/>, 'Nenhuma conta fixa neste mês.'))}

      {kind === 'cartoes' && (cardItems.length ? <ul data-testid="list-cards" className="mt-5 divide-y divide-line border-y border-line">
        {cardItems.map((card) => <li key={card.id}><button data-testid={`row-card-${card.id}`} onClick={() => selectCard.mutate({ cardId: card.id })} className="flex min-h-16 w-full items-center gap-3 py-3 text-left transition hover:bg-surface">
          <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: CARD_COLORS[card.color].background }}/>
          <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-ink">{card.name}</span><span className="mt-0.5 block text-[13px] text-ink-soft">{plural(card.movementCount, 'compra', 'compras')}</span></span>
          <span className="shrink-0 font-mono-data text-[15px] text-ink">{money(card.invoiceAmount)}</span>
          <ChevronRight size={16} className="shrink-0 text-ink-soft"/>
        </button></li>)}
      </ul> : emptyBox('text-cards-empty', <CreditCard size={16}/>, 'Nenhum cartão cadastrado.'))}

      {kind === 'gastos' && <>
        {dailyItems.length + forecastDaily.length ? <ul data-testid="list-daily" className="mt-5 divide-y divide-line border-y border-line">
          {dailyItems.map((item) => <li key={item.id} data-testid={`row-daily-${item.id}`} className="flex items-center gap-1">
            <button type="button" aria-label={`Editar ${item.description}`} onClick={() => setDailyForm({ item })} className={rowButton}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{item.description}</span>
                <span className={subtitle}><span className="flex items-center gap-1"><CalendarDays size={13}/>{dateLabel(item.date)}</span>{item.categoryName && <span className="truncate rounded-full bg-tint px-2 py-0.5 text-[12px] font-medium text-brand">{item.categoryName}</span>}</span>
              </span>
              <span className="shrink-0 font-mono-data text-[15px] text-ink">− {money(item.amount)}</span>
            </button>
            <RowMenu title={item.description} editTestId={`button-edit-daily-${item.id}`} deleteTestId={`button-delete-daily-${item.id}`} onEdit={() => setDailyForm({ item })} onDelete={() => void removeDaily(item)}/>
          </li>)}
          {forecastRows(forecastDaily)}
        </ul> : emptyBox('text-daily-empty', <ShoppingBasket size={16}/>, 'Nenhum gasto neste mês.')}
        {(daily.data?.summary.length ?? 0) > 0 && <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">Por categoria</h2>
          <p className="mb-3 text-sm text-ink-soft">{plural(dailyItems.length + forecastDaily.length, 'gasto', 'gastos')} no mês</p>
          <HBars fill="bg-chart-out" label="Gastos por categoria" testId="list-daily-summary" rowTestId={(key) => `row-daily-summary-${key}`}
            rows={(daily.data?.summary ?? []).map((row) => ({ key: String(row.categoryId ?? 'none'), label: row.name ?? 'Sem categoria', amount: row.amount, percent: row.percent }))}/>
        </section>}
      </>}
      </>}
    </div>

    {incomeForm && <IncomeDialog key={`${incomeForm.item?.incomeId ?? 'new'}-${incomeForm.scope ?? ''}`} month={month} item={incomeForm.item} scope={incomeForm.scope} busy={busy} error={formError} onClose={() => setIncomeForm(null)} onSave={saveIncome}/>}
    {billForm && <BillDialog key={`${billForm.item?.billId ?? 'new'}-${billForm.scope ?? ''}`} month={month} item={billForm.item} scope={billForm.scope} busy={busy} error={formError} onClose={() => setBillForm(null)} onSave={saveBill}/>}
    {dailyForm && <DailyDialog key={dailyForm.item?.id ?? 'new'} month={month} item={dailyForm.item} categories={categories} busy={busy} error={formError} onClose={() => setDailyForm(null)} onSave={saveDaily}/>}
    {scopeAsk && <ScopeDialog subject={scopeAsk.kind === 'income' ? 'entrada' : 'conta fixa'} action={scopeAsk.action} month={month} onChoose={chooseScope} onClose={() => setScopeAsk(null)}/>}
    <Notice notice={notice}/>
  </main>;
}
