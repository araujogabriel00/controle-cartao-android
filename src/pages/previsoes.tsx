import { useState } from 'react';
import { useLocation } from 'wouter';
import { getGetForecastRangeQueryKey, getGetForecastSummaryQueryKey, getGetForecastsQueryKey, useGetForecastRange, useGetForecastSummary, useGetForecasts, type ForecastOccurrence } from '@workspace/api-client-react';
import { ChevronRight, CircleHelp, Plus } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { dayTitle, ForecastRowBody, shortDateName, signedAmount, signedDelta } from '@/components/forecast-parts';
import { forecastBalancePath, forecastDayPath, forecastEditPath, money, monthName, today, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Dias do mês na grade de 7 colunas, com vazios antes do dia 1 (a semana começa no domingo).
function monthCells(month: MonthKey) {
  const lead = new Date(`${month}-01T12:00:00`).getDay();
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)] as (string | null)[];
}

// Nome acessível do dia: "27 de outubro, a receber, a pagar, hoje" (RF-03).
function dayName(date: string, items: ForecastOccurrence[]) {
  const parts = [`${Number(date.slice(8, 10))} de ${monthName(date.slice(0, 7))}`];
  if (items.some((i) => i.kind === 'receive' && i.affects)) parts.push('a receber');
  if (items.some((i) => i.kind === 'pay' && i.affects)) parts.push('a pagar');
  if (items.some((i) => !i.affects)) parts.push('lembrete');
  if (date === today()) parts.push('hoje');
  return parts.join(', ');
}

// specs/previsoes.md RF-02 a RF-04, RF-11: resumo, calendário do mês com o dia selecionado e a lista do dia.
export default function Previsoes({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  useRememberMonth(month);
  const todayDate = today();
  // RF-02: o dia selecionado começa em hoje, ou no dia 1 em outro mês.
  const [selected, setSelected] = useState(month === todayDate.slice(0, 7) ? todayDate : `${month}-01`);
  const forecasts = useGetForecasts(month, { query: { queryKey: getGetForecastsQueryKey(month), refetchOnWindowFocus: true } });
  const summary = useGetForecastSummary(month, { query: { queryKey: getGetForecastSummaryQueryKey(month), refetchOnWindowFocus: true } }).data;
  const range = useGetForecastRange({ query: { queryKey: getGetForecastRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;

  const items = forecasts.data?.items ?? [];
  const byDate = (date: string) => items.filter((item) => item.date === date);
  const dayItems = byDate(selected);
  // RF-04: o título do dia mostra o total que mexe no saldo.
  const dayTotal = dayItems.filter((item) => item.affects).reduce((total, item) => total + (item.kind === 'receive' ? item.amount : -item.amount), 0);
  const cells = monthCells(month);

  const targetLabel = summary?.targetDate ? shortDateName(summary.targetDate) : null;
  const delta = summary && summary.projected !== null ? Math.round((summary.projected - summary.balance) * 100) / 100 : null;
  // RN-09: "Saldo hoje" no mês corrente, "Saldo de ‹mês›" nos outros; mês passado não tem projeção para abrir.
  const baseLabel = month === todayDate.slice(0, 7) ? 'Saldo hoje' : `Saldo de ${monthName(month)}`;
  const pastMonth = month < todayDate.slice(0, 7);
  const Summary = pastMonth ? 'div' : 'button';

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <AppHeader area="forecasts" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>

      {forecasts.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as previsões.</h2><p className="mt-1 text-[14px] text-ink-soft">Seus dados continuam salvos. O saldo do resto do app não mudou.</p><button data-testid="button-retry-forecasts" onClick={() => void forecasts.refetch()} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : forecasts.isLoading ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[96px] animate-pulse rounded-2xl bg-line"/><div className="h-[330px] animate-pulse rounded-2xl bg-line"/></div>
        : <>
          {/* RF-02, RF-09: o saldo de hoje e o previsto no fim do mês; abre o Saldo previsto. */}
          <Summary data-testid="card-forecast-summary" {...(pastMonth ? {} : { onClick: () => navigate(forecastBalancePath(month)) })} aria-label={`${baseLabel} ${money(summary?.balance ?? 0)}${targetLabel && summary?.projected != null ? `; previsto em ${targetLabel} ${money(summary.projected)}` : ''}.${pastMonth ? '' : ' Abrir o saldo previsto.'}`} className={`enter mt-4 block w-full rounded-2xl border border-line bg-surface p-4 text-left transition ${pastMonth ? '' : 'hover:bg-hover'}`}>
            <span className="grid grid-cols-2 gap-4">
              <span><span className="block text-[14px] font-medium text-ink-soft">{baseLabel}</span><span data-testid="text-forecast-today" className="mt-0.5 block font-display text-[24px] leading-tight text-ink [overflow-wrap:anywhere]">{summary ? money(summary.balance) : '—'}</span><span className="block text-[14px] text-ink-soft">só o que entra no saldo</span></span>
              <span><span className="block text-[14px] font-medium text-ink-soft">{targetLabel ? `Previsto em ${targetLabel}` : 'Previsto'}</span><span data-testid="text-forecast-projected" className="mt-0.5 block font-display text-[24px] leading-tight text-ink [overflow-wrap:anywhere]">{summary?.projected != null ? money(summary.projected) : '—'}</span><span className="block text-[14px] text-ink-soft">{delta !== null ? signedDelta(delta) : 'mês já passou'}</span></span>
            </span>
            {!pastMonth && <span data-testid="link-balance-forecast" className="mt-3 flex items-center justify-end gap-1 text-[15px] font-semibold text-brand">Saldo previsto<ChevronRight aria-hidden size={18}/></span>}
          </Summary>

          {/* RF-03: o calendário do mês; cada dia é um botão de 48 px com pontos para o que há nele. */}
          <section data-testid="calendar-forecasts" aria-label={`Calendário de ${monthName(month)}`} className="enter mt-5" style={{ animationDelay: '.06s' }}>
            <div aria-hidden className="grid grid-cols-7 text-center text-[12px] font-medium text-ink-soft">{WEEK.map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
            <div role="grid" aria-label="Dias do mês" className="grid grid-cols-7">
              {cells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} aria-hidden/>;
                const here = byDate(date);
                const isToday = date === todayDate;
                const isSelected = date === selected;
                return <button key={date} type="button" data-testid={`day-${date}`} aria-label={dayName(date, here)} aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined} onClick={() => setSelected(date)} className="grid h-12 place-items-center">
                  <span className={`grid h-11 w-11 place-items-center rounded-full text-[15px] ${isSelected ? 'bg-ink font-semibold text-paper' : 'text-ink'} ${isToday && !isSelected ? 'ring-2 ring-ink' : ''}`}>
                    <span className="flex flex-col items-center leading-none"><span>{Number(date.slice(8, 10))}</span>
                      <span aria-hidden className="mt-1 flex h-1.5 items-center gap-0.5">
                        {here.some((i) => i.kind === 'receive' && i.affects) && <span className="h-1.5 w-1.5 rounded-full bg-chart-in"/>}
                        {here.some((i) => i.kind === 'pay' && i.affects) && <span className="h-1.5 w-1.5 rounded-full bg-chart-out"/>}
                        {here.some((i) => !i.affects) && <span className={`h-1.5 w-1.5 rounded-full border ${isSelected ? 'border-paper' : 'border-ink-soft'}`}/>}
                      </span>
                    </span>
                  </span>
                </button>;
              })}
            </div>
            <ul aria-label="Legenda" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-soft">
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-chart-in"/>A receber</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-chart-out"/>A pagar</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full border border-ink-soft"/>Fora do saldo</li>
            </ul>
          </section>

          {/* RF-04, RF-11: a lista do dia selecionado, ou o estado vazio com o "Como funciona". */}
          <section aria-label="Previsões do dia" className="enter mt-6" style={{ animationDelay: '.1s' }}>
            <div className="flex items-center justify-between gap-3">
              <button data-testid="button-open-day" onClick={() => navigate(forecastDayPath(selected))} aria-label={`${dayTitle(selected)}. Abrir o dia.`} className="-ml-2 flex min-h-12 min-w-0 items-center gap-1 rounded-full px-2 text-left transition hover:bg-hover"><h2 className="truncate font-display text-[20px] text-ink">{dayTitle(selected)}</h2><ChevronRight aria-hidden size={18} className="shrink-0 text-ink-soft"/></button>
              {dayItems.some((item) => item.affects) && <span data-testid="text-day-total" className="shrink-0 font-mono-data text-[15px] text-ink-soft">{signedDelta(Math.round(dayTotal * 100) / 100)}</span>}
            </div>
            {dayItems.length > 0
              ? <ul data-testid="list-forecasts" className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
                {dayItems.map((item) => <li key={`${item.forecastId}-${item.month}`}>
                  <button type="button" data-testid={`row-forecast-${item.forecastId}`} aria-label={`Editar previsão ${item.description}. ${signedAmount(item.kind, item.amount)}`} onClick={() => navigate(forecastEditPath(item.forecastId, item.month))} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-hover"><ForecastRowBody item={item}/></button>
                </li>)}
              </ul>
              : <p data-testid="text-forecast-day-empty" className="mt-2 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[15px] text-ink-soft">{selected === todayDate ? 'Nada previsto para hoje.' : 'Nada previsto para este dia.'}</p>}
          </section>

          {items.length === 0 && <section data-testid="section-how-it-works" aria-label="Como funciona" className="enter mt-6 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: '.14s' }}>
            <h2 className="font-display text-[20px] text-ink">Como funciona</h2>
            <ol className="mt-3 space-y-3">
              {['Anote o que você vai receber ou pagar e em que dia.', 'Escolha se a previsão mexe no saldo no dia ou se é só um lembrete.', 'No dia, ela entra no saldo sozinha. Se não aconteceu, apague.'].map((text, i) => <li key={text} className="flex items-start gap-3"><span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tint font-display text-[16px] text-brand">{i + 1}</span><span className="pt-1 text-[15px] text-ink-soft">{text}</span></li>)}
            </ol>
            <button data-testid="button-new-forecast-empty" onClick={() => navigate('/previsoes/nova')} className="mt-4 flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={18}/>Nova previsão</button>
          </section>}
        </>}
    </div>
  </main>;
}
