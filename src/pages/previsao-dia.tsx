import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetForecastDayQueryKey, useDeleteForecast, useGetForecastDay, usePutForecastInBalance, useSetForecastAmount,
  type ForecastOccurrence, type IncomeScope,
} from '@workspace/api-client-react';
import { Bell, CircleHelp, Info, Pencil, Trash2 } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { BottomSheet } from '@/components/bottom-sheet';
import { dayTitle, ForecastRowBody, signedDelta } from '@/components/forecast-parts';
import { Notice, useNotice } from '@/components/notice';
import { ScopeDialog } from '@/components/scope-dialog';
import { scopeSuffix, undoable } from '@/components/undo-snackbar';
import { areaPath, forecastEditPath, monthOf, today } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

const action = 'flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[14px] font-semibold text-ink transition hover:bg-hover';

// specs/previsoes.md RF-07, RF-08: a tela do dia. Cada ocorrência tem "Editar valor" (só dela), "Apagar" (com Desfazer e,
// se se repete, a escolha do alcance) e, nos lembretes, "Colocar no saldo". Hoje, um aviso diz o que entrou no saldo.
export default function PrevisaoDia({ date }: { date: string }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const month = monthOf(date);
  useRememberMonth(month);
  const day = useGetForecastDay(date, { query: { queryKey: getGetForecastDayQueryKey(date), refetchOnWindowFocus: true } });
  const items = day.data?.items ?? [];
  const { notice, notify, failed } = useNotice();
  const [scopeAsk, setScopeAsk] = useState<ForecastOccurrence | null>(null);
  const [editing, setEditing] = useState<ForecastOccurrence | null>(null);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  // O saldo, as listas de Entradas, o Início e o calendário leem estas previsões: tudo é recarregado.
  const refresh = () => { void client.invalidateQueries(); };
  const deleteForecast = useDeleteForecast({ mutation: { onSuccess: () => refresh(), onError: failed } });
  const putInBalance = usePutForecastInBalance({ mutation: { onSuccess: () => { refresh(); notify('Colocada no saldo.'); }, onError: failed } });
  const setAmountMutation = useSetForecastAmount({ mutation: { onSuccess: () => { refresh(); setEditing(null); notify('Valor atualizado.'); }, onError: (error) => setAmountError(error.message) } });

  const remove = (item: ForecastOccurrence, scope: IncomeScope) => {
    const text = item.recurring ? `${item.description} removida${scopeSuffix(scope)}.` : `${item.description} removida.`;
    deleteForecast.mutate({ forecastId: item.forecastId, month: item.month, scope }, undoable(item.description, text));
  };

  const isToday = date === today();
  const entered = items.filter((item) => item.state === 'in-balance');
  const reminders = items.filter((item) => item.state === 'reminder');
  const total = Math.round(items.filter((item) => item.affects).reduce((sum, item) => sum + (item.kind === 'receive' ? item.amount : -item.amount), 0) * 100) / 100;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => navigate(areaPath('forecasts', month))}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <p className="font-mono-data text-xs uppercase tracking-[.08em] text-eyebrow">Previsões</p>
        <h1 data-testid="text-day-title" className="mt-1 font-display text-[28px] leading-tight text-ink">{dayTitle(date)}</h1>
        {items.some((item) => item.affects) && <p className="mt-1 text-[15px] text-ink-soft">Mexe no saldo: <span data-testid="text-day-total" className="font-mono-data text-ink">{signedDelta(total)}</span></p>}
      </section>

      {/* RF-07: o que entrou no saldo hoje, citando os lembretes que ficaram de fora. */}
      {isToday && entered.length > 0 && <p data-testid="banner-forecast-today" role="status" className="enter mt-4 flex items-start gap-2 rounded-2xl border border-line bg-warn-tint px-4 py-3 text-[14px] leading-5 text-eyebrow"><Info aria-hidden size={16} className="mt-0.5 shrink-0"/><span><b className="font-semibold">{entered.length === 1 ? '1 previsão entrou' : `${entered.length} previsões entraram`} no saldo hoje.</b> Apague as que não aconteceram.{reminders.length > 0 && <> {reminders.length === 1 ? 'O lembrete' : 'Os lembretes'} {reminders.map((r) => `“${r.description}”`).join(', ')} {reminders.length === 1 ? 'ficou' : 'ficaram'} fora do saldo.</>}</span></p>}

      {day.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir este dia.</h2><button onClick={() => void day.refetch()} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : day.isLoading ? <div aria-busy="true" className="mt-6 h-[160px] animate-pulse rounded-2xl bg-line"/>
        : items.length === 0 ? <p data-testid="text-forecast-day-empty" className="mt-6 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-[15px] text-ink-soft">{isToday ? 'Nada previsto para hoje.' : 'Nada previsto para este dia.'}</p>
        : <ul data-testid="list-forecasts" className="mt-5 space-y-3">
          {items.map((item) => <li key={`${item.forecastId}-${item.month}`} data-testid={`row-forecast-${item.forecastId}`} className="enter overflow-hidden rounded-2xl border border-line bg-surface">
            <button type="button" aria-label={`Editar previsão ${item.description}`} onClick={() => navigate(forecastEditPath(item.forecastId, item.month))} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-hover"><ForecastRowBody item={item}/></button>
            <div className="flex flex-wrap gap-2 border-t border-line px-3 py-2">
              {item.state === 'reminder' && <button type="button" data-testid="button-put-in-balance" onClick={() => putInBalance.mutate({ forecastId: item.forecastId, month: item.month })} className={`${action} min-w-full text-brand`}><Bell aria-hidden size={16}/>Colocar no saldo</button>}
              <button type="button" data-testid="button-edit-amount" onClick={() => { setAmount(String(item.amount)); setAmountError(null); setEditing(item); }} className={action}><Pencil aria-hidden size={16}/>Editar valor</button>
              <button type="button" data-testid="button-delete-forecast" onClick={() => (item.recurring ? setScopeAsk(item) : remove(item, 'forward'))} className={`${action} text-alert`}><Trash2 aria-hidden size={16}/>Apagar</button>
            </div>
          </li>)}
        </ul>}
    </div>

    {scopeAsk && <ScopeDialog subject="previsão" action="delete" month={scopeAsk.month} onChoose={(scope) => { const item = scopeAsk; setScopeAsk(null); remove(item, scope); }} onClose={() => setScopeAsk(null)}/>}

    {/* D9, RN-05: o valor muda só desta ocorrência. */}
    {editing && <BottomSheet title="Editar valor" onClose={() => setEditing(null)}>
      <form onSubmit={(event) => { event.preventDefault(); setAmountError(null); setAmountMutation.mutate({ forecastId: editing.forecastId, month: editing.month, amount: Number(amount.replace(',', '.')) }); }}>
        <p className="mb-3 text-[14px] text-ink-soft">{editing.description}: só esta ocorrência muda; as outras continuam com o valor da previsão.</p>
        <label className="field-label" htmlFor="forecast-amount">Valor</label>
        <div className="relative"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span><input id="forecast-amount" data-testid="input-forecast-amount" inputMode="decimal" className="field-input pl-12" value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus/></div>
        {amountError && <p role="alert" data-testid="text-form-error" className="mt-2 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{amountError}</p>}
        <button type="submit" disabled={setAmountMutation.isPending} className="mt-3 h-12 w-full rounded-full bg-brand text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">Salvar valor</button>
      </form>
    </BottomSheet>}
    <Notice notice={notice}/>
  </main>;
}
