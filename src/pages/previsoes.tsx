import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getGetForecastRangeQueryKey, getGetForecastDayBalancesQueryKey, getGetForecastsQueryKey, useGetForecastDayBalances, useGetForecastRange, useGetForecasts, type ForecastOccurrence } from '@workspace/api-client-react';
import { ChevronUp, CircleHelp, Plus } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { dayTitle, ForecastRowBody, signedAmount, signedDelta } from '@/components/forecast-parts';
import { forecastDayPath, forecastEditPath, money, monthName, plural, today, type MonthKey } from '@/lib/format';
import { useHideValues } from '@/lib/hide-values';
import { useRememberMonth } from '@/lib/last-month';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Dias do mês na grade de 7 colunas, com vazios antes do dia 1 (a semana começa no domingo).
function monthCells(month: MonthKey) {
  const lead = new Date(`${month}-01T12:00:00`).getDay();
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)] as (string | null)[];
}

// Nome acessível do dia: "27 de outubro, a receber, a pagar, hoje" (RF-03).
function dayName(date: string, items: ForecastOccurrence[], balance: number | null) {
  const parts = [`${Number(date.slice(8, 10))} de ${monthName(date.slice(0, 7))}`];
  if (items.some((i) => i.kind === 'receive' && i.affects)) parts.push('a receber');
  if (items.some((i) => i.kind === 'pay' && i.affects)) parts.push('a pagar');
  if (items.some((i) => !i.affects)) parts.push('lembrete');
  if (date === today()) parts.push('hoje');
  if (balance !== null) parts.push(balance < 0 ? `saldo negativo ${money(balance)}` : `saldo ${money(balance)}`);
  return parts.join(', ');
}

// D1, D10, RN-06: reais inteiros sem abreviar; acima de 6 caracteres, milhares com "k"; "•••" com o olho fechado.
function cellBalance(value: number, hidden: boolean) {
  if (hidden) return '•••';
  const abs = Math.round(Math.abs(value));
  const sign = value < 0 && abs !== 0 ? '−' : '';
  const full = `${sign}${abs.toLocaleString('pt-BR')}`;
  return full.length > 6 ? `${sign}${Math.round(abs / 1000)}k` : full;
}

// specs/previsoes-saldo-por-dia.md e specs/previsoes-folha-recolhida.md: calendário do mês com o saldo de cada dia e a barra do dia
// selecionado, recolhida (nunca cobre o calendário) e aberta em folha com a lista completa.
export default function Previsoes({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  useRememberMonth(month);
  const todayDate = today();
  // RF-02: o dia selecionado começa em hoje, ou no dia 1 em outro mês.
  const [selected, setSelected] = useState(month === todayDate.slice(0, 7) ? todayDate : `${month}-01`);
  const forecasts = useGetForecasts(month, { query: { queryKey: getGetForecastsQueryKey(month), refetchOnWindowFocus: true } });
  const balances = useGetForecastDayBalances(month, { query: { queryKey: getGetForecastDayBalancesQueryKey(month), refetchOnWindowFocus: true } }).data;
  const hidden = useHideValues();
  // D1, D3: a folha do dia tem dois estados; recolhida é o padrão e trocar de mês recolhe (D8).
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const sheetTitleRef = useRef<HTMLHeadingElement>(null);
  const toggled = useRef(false);
  const touchY = useRef<number | null>(null);
  const setSheetOpen = (value: boolean) => { toggled.current = true; setOpen(value); };
  const range = useGetForecastRange({ query: { queryKey: getGetForecastRangeQueryKey() } }).data;
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;

  const items = forecasts.data?.items ?? [];
  const byDate = (date: string) => items.filter((item) => item.date === date);
  const dayItems = byDate(selected);
  // RF-04: o título do dia mostra o total que mexe no saldo.
  const dayTotal = dayItems.filter((item) => item.affects).reduce((total, item) => total + (item.kind === 'receive' ? item.amount : -item.amount), 0);
  const cells = monthCells(month);

  const balanceOf = (date: string) => balances?.find((b) => b.date === date) ?? null;
  const selectedBalance = balanceOf(selected)?.balance ?? null;
  // D2: "N previsões · saldo R$ X"; sem a parte do saldo em dia passado.
  const barSummary = [dayItems.length ? plural(dayItems.length, 'previsão', 'previsões') : 'Nada previsto', selectedBalance !== null ? `saldo ${money(selectedBalance)}` : null].filter(Boolean).join(' · ');

  useEffect(() => { setOpen(false); }, [month]);
  // D9: ao abrir, o foco vai para o título da folha; ao recolher, volta ao botão que abriu. Escape recolhe.
  useEffect(() => {
    if (!toggled.current) return;
    if (open) sheetTitleRef.current?.focus(); else openerRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 pb-[calc(68px+12px)] sm:px-8">
      <AppHeader area="forecasts" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>

      {forecasts.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as previsões.</h2><p className="mt-1 text-[14px] text-ink-soft">Seus dados continuam salvos. O saldo do resto do app não mudou.</p><button data-testid="button-retry-forecasts" onClick={() => void forecasts.refetch()} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : forecasts.isLoading ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[96px] animate-pulse rounded-2xl bg-line"/><div className="h-[330px] animate-pulse rounded-2xl bg-line"/></div>
        : <>
          {/* RF-03: o calendário do mês; cada dia é um botão de 50 px com pontos para o que há nele. */}
          <section data-testid="calendar-forecasts" aria-label={`Calendário de ${monthName(month)}`} className="enter mt-5" style={{ animationDelay: '.06s' }}>
            <div aria-hidden className="grid grid-cols-7 text-center text-[12px] font-medium text-ink-soft">{WEEK.map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
            <div role="grid" aria-label="Dias do mês" className="grid grid-cols-7">
              {cells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} aria-hidden/>;
                const here = byDate(date);
                const isToday = date === todayDate;
                const isSelected = date === selected;
                const day = balanceOf(date);
                const bold = isToday || !!day?.hasForecast;
                return <button key={date} type="button" data-testid={`day-${date}`} aria-label={dayName(date, here, day?.balance ?? null)} aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined} onClick={() => setSelected(date)} className="grid h-[50px] place-items-center">
                  <span className={`flex h-12 w-full max-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl leading-none ${isSelected ? 'bg-ink text-paper' : 'text-ink'} ${isToday && !isSelected ? 'ring-2 ring-ink' : ''}`}>
                    <span className={`text-[15px] ${isSelected ? 'font-semibold' : ''}`}>{Number(date.slice(8, 10))}</span>
                    <span aria-hidden className="flex h-1.5 items-center gap-0.5">
                      {here.some((i) => i.kind === 'receive' && i.affects) && <span className="h-1.5 w-1.5 rounded-full bg-chart-in"/>}
                      {here.some((i) => i.kind === 'pay' && i.affects) && <span className="h-1.5 w-1.5 rounded-full bg-chart-out"/>}
                      {here.some((i) => !i.affects) && <span className={`h-1.5 w-1.5 rounded-full border ${isSelected ? 'border-paper' : 'border-ink-soft'}`}/>}
                    </span>
                    <span aria-hidden data-testid={`balance-${date}`} className={`h-3 font-mono-data text-[12px] ${bold ? 'font-bold' : 'font-normal'} ${isSelected ? '' : day?.balance != null && day.balance < 0 ? 'text-alert' : bold ? 'text-ink' : 'text-ink-soft'}`}>{day?.balance != null ? cellBalance(day.balance, hidden) : ''}</span>
                  </span>
                </button>;
              })}
            </div>
            <ul aria-label="Legenda" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-soft">
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-chart-in"/>A receber</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-chart-out"/>A pagar</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full border border-ink-soft"/>Fora do saldo</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="font-mono-data font-bold text-ink">10.070</span>saldo em R$ no fim do dia</li>
            </ul>
          </section>

          {/* RF-04, RF-09: o estado vazio, acima da folha do dia. */}
          {items.length === 0 && <section data-testid="section-how-it-works" aria-label="Como funciona" className="enter mt-5 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: '.14s' }}>
            <h2 className="font-display text-[20px] text-ink">Como funciona</h2>
            <ol className="mt-3 space-y-3">
              {['Anote o que você vai receber ou pagar e em que dia.', 'Escolha se a previsão mexe no saldo no dia ou se é só um lembrete.', 'No dia, ela entra no saldo sozinha. Se não aconteceu, apague.'].map((text, i) => <li key={text} className="flex items-start gap-3"><span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tint font-display text-[16px] text-brand">{i + 1}</span><span className="pt-1 text-[15px] text-ink-soft">{text}</span></li>)}
            </ol>
            <button data-testid="button-new-forecast-empty" onClick={() => navigate('/previsoes/nova')} className="mt-4 flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={18}/>Nova previsão</button>
          </section>}

          {/* D2: a barra recolhida, fixa e de altura fixa; nunca cobre o calendário (D7). */}
          {!open && <section data-testid="bar-day" aria-label="Previsões do dia" className="fixed inset-x-0 z-20 mx-auto max-w-[860px] rounded-t-3xl border border-b-0 border-line bg-surface px-4 shadow-[0_-10px_30px_-18px_rgba(0,0,0,.6)] bottom-[calc(72px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]">
            <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-line"/>
            <div className="flex h-14 items-center gap-2">
              <button ref={openerRef} type="button" data-testid="button-open-sheet" aria-expanded={false} aria-label={`${dayTitle(selected)}. ${barSummary}. Abrir as previsões do dia.`} onClick={() => setSheetOpen(true)} className="-ml-2 flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 text-left transition hover:bg-hover">
                <span className="min-w-0 flex-1"><span className="block truncate font-display text-[18px] leading-tight text-ink">{dayTitle(selected)}</span><span data-testid="text-bar-summary" className="block truncate text-[14px] leading-tight text-ink-soft">{barSummary}</span></span>
                <ChevronUp aria-hidden size={20} className="shrink-0 text-ink-soft"/>
              </button>
              <button type="button" data-testid="button-new-forecast-bar" aria-label="Nova previsão" onClick={() => navigate('/previsoes/nova')} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/></button>
            </div>
          </section>}

          {/* D4: a folha aberta, com o fundo escurecido; tocar no fundo recolhe. */}
          {open && <div data-testid="overlay-day" onMouseDown={(event) => { if (event.target === event.currentTarget) setSheetOpen(false); }} className="fixed inset-x-0 top-0 z-20 flex items-end bg-[rgba(0,0,0,.35)] bottom-[calc(72px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]">
            <section data-testid="sheet-day" aria-label="Previsões do dia" className="mx-auto flex max-h-[45vh] w-full max-w-[860px] flex-col rounded-t-3xl border border-b-0 border-line bg-surface px-4 pb-3 shadow-[0_-10px_30px_-18px_rgba(0,0,0,.6)]">
              <div aria-hidden data-testid="sheet-handle" className="-mx-4 flex h-6 shrink-0 cursor-grab items-center justify-center" onTouchStart={(event) => { touchY.current = event.touches[0].clientY; }} onTouchEnd={(event) => { if (touchY.current !== null && event.changedTouches[0].clientY - touchY.current > 50) setSheetOpen(false); touchY.current = null; }}><div className="h-1 w-10 rounded-full bg-line"/></div>
              <div className="flex shrink-0 items-center justify-between gap-3">
                <h2 ref={sheetTitleRef} tabIndex={-1} data-testid="text-sheet-title" className="min-h-12 min-w-0 flex-1 truncate font-display text-[20px] leading-[48px] text-ink outline-none">{dayTitle(selected)}</h2>
                {dayItems.some((item) => item.affects) && <span data-testid="text-day-total" className="shrink-0 font-mono-data text-[15px] text-ink-soft">{signedDelta(Math.round(dayTotal * 100) / 100)}</span>}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {dayItems.length > 0
                  ? <ul data-testid="list-forecasts" className="divide-y divide-line">
                    {dayItems.map((item) => <li key={`${item.forecastId}-${item.month}`}>
                      <button type="button" data-testid={`row-forecast-${item.forecastId}`} aria-label={`Editar previsão ${item.description}. ${signedAmount(item.kind, item.amount)}`} onClick={() => navigate(forecastEditPath(item.forecastId, item.month))} className="flex min-h-[72px] w-full items-center gap-3 py-3 text-left transition hover:bg-hover"><ForecastRowBody item={item}/></button>
                    </li>)}
                  </ul>
                  : <p data-testid="text-forecast-day-empty" className="py-3 text-center text-[15px] text-ink-soft">{selected === todayDate ? 'Nada previsto para hoje.' : 'Nada previsto para este dia.'}</p>}
              </div>
              {selectedBalance !== null && <div className="mt-1 flex shrink-0 items-center justify-between gap-3 border-t border-line pt-2"><span className="text-[15px] text-ink-soft">Saldo no fim do dia</span><span data-testid="text-day-balance" className={`font-mono-data text-[18px] font-semibold ${selectedBalance < 0 ? 'text-alert' : 'text-ink'}`}>{money(selectedBalance)}</span></div>}
              <div className="mt-3 grid shrink-0 grid-cols-2 gap-2">
                <button type="button" data-testid="button-open-day" onClick={() => navigate(forecastDayPath(selected))} className="h-12 rounded-full border-[1.5px] border-line text-[15px] font-semibold text-ink transition hover:bg-hover">Abrir o dia</button>
                <button type="button" data-testid="button-new-forecast-sheet" onClick={() => navigate('/previsoes/nova')} className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={18} strokeWidth={2.2}/>Nova previsão</button>
              </div>
            </section>
          </div>}
        </>}
    </div>
  </main>;
}
