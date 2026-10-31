import { useLocation } from 'wouter';
import { getGetBalanceForecastQueryKey, useGetBalanceForecast } from '@workspace/api-client-react';
import { CircleHelp } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { ForecastLine } from '@/components/charts/forecast-line';
import { dayTitle, ForecastRowBody, shortDate, signedDelta } from '@/components/forecast-parts';
import { currentMonth, forecastDayPath, money, monthName, type MonthKey } from '@/lib/format';

const DAYS = 21;

// specs/previsoes.md RF-09, D11, RN-08: o saldo de hoje até 21 dias à frente, somando só as previsões que mexem no saldo.
// Faturas de cartão, contas fixas recorrentes, benefícios e lembretes ficam de fora.
// O mês aberto dá o saldo base (RN-08): hoje, no mês corrente (hoje a +21 dias), ou o do mês futuro (dia 1 ao último dia).
export default function PrevisaoSaldo({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  const isCurrent = month === currentMonth();
  const forecast = useGetBalanceForecast(month, DAYS, { query: { queryKey: getGetBalanceForecastQueryKey(month, DAYS), refetchOnWindowFocus: true } });
  const data = forecast.data;
  const diff = data ? Math.round((data.endBalance - data.balance) * 100) / 100 : 0;
  const negative = (data?.endBalance ?? 0) < 0;

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/previsoes'))}/>

      {forecast.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h1 className="mt-3 font-display text-[20px] text-ink">Não conseguimos calcular o saldo previsto.</h1><p className="mt-1 text-[14px] text-ink-soft">Seus dados continuam salvos.</p><button data-testid="button-retry-forecasts" onClick={() => void forecast.refetch()} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : !data ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[96px] animate-pulse rounded-2xl bg-line"/><div className="h-[190px] animate-pulse rounded-2xl bg-line"/></div>
        : <>
          <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
            <h1 className="font-display text-[22px] leading-tight text-ink">Saldo previsto</h1>
            <p className="mt-1 text-sm font-medium text-ink-soft">Saldo previsto em {shortDate(data.endDate)}</p>
            <p data-testid="text-balance-forecast" className={`font-display text-[34px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] ${negative ? 'text-alert' : 'text-ink'}`}>{money(data.endBalance)}</p>
            <p data-testid="text-balance-forecast-diff" className="mt-1 text-[14px] text-ink-soft"><span className="font-mono-data text-ink">{signedDelta(diff)}</span> em relação {isCurrent ? 'a hoje' : `ao saldo de ${monthName(month)}`} ({money(data.balance)})</p>
          </section>

          <section aria-label="Gráfico do saldo previsto" className="enter mt-5" style={{ animationDelay: '.1s' }}>
            <ForecastLine points={data.points} startsToday={isCurrent}/>
            <p className="mt-2 text-[14px] text-ink-soft">Conta só as previsões que mexem no saldo. Lembretes ficam de fora.</p>
          </section>

          <section aria-label="Próximas previsões" className="enter mt-6" style={{ animationDelay: '.14s' }}>
            <h2 className="font-display text-[20px] text-ink">Próximas previsões</h2>
            {data.upcoming.length === 0 ? <p data-testid="text-upcoming-empty" className="mt-2 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[15px] text-ink-soft">{isCurrent ? `Nada previsto nos próximos ${DAYS} dias.` : `Nada previsto em ${monthName(month)}.`}</p>
              : <ul data-testid="list-forecasts" className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
                {data.upcoming.map((item) => <li key={`${item.forecastId}-${item.month}`}>
                  <button type="button" data-testid={`row-forecast-${item.forecastId}`} aria-label={`${dayTitle(item.date)}: ${item.description}. Abrir o dia.`} onClick={() => navigate(forecastDayPath(item.date))} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-hover">
                    <span className="w-12 shrink-0 text-center font-mono-data text-[14px] text-ink-soft">{shortDate(item.date)}</span>
                    <ForecastRowBody item={item}/>
                  </button>
                </li>)}
              </ul>}
          </section>
        </>}
    </div>
  </main>;
}
