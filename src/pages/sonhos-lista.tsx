import { useLocation } from 'wouter';
import { getGetDreamEntriesQueryKey, useGetDreamEntries } from '@workspace/api-client-react';
import { CircleHelp, Moon } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { areaPath, capitalize, dateLabel, money, monthLabel, type MonthKey } from '@/lib/format';
import { useRememberMonth } from '@/lib/last-month';

const NBSP = ' ';

// specs/sonhos.md RF-10: "Guardado em sonhos" do mês, com cada aporte e retirada; tocar abre o sonho.
export default function SonhosLista({ month }: { month: MonthKey }) {
  useRememberMonth(month);
  const [, navigate] = useLocation();
  const entries = useGetDreamEntries(month, { query: { queryKey: getGetDreamEntriesQueryKey(month), refetchOnWindowFocus: true } });
  const data = entries.data;
  const total = data?.savingsAmount ?? 0;
  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => navigate(areaPath('income', month))}/>
      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-eyebrow"><Moon size={14}/><p className="font-mono-data text-xs uppercase tracking-[.08em]">Aportes e retiradas · {capitalize(monthLabel(month))}</p></div>
        <h1 data-testid="text-list-title" className="mt-1 font-display text-[28px] leading-tight text-ink">Guardado em sonhos</h1>
        <p data-testid="text-list-total" className="mt-2 font-mono-data text-[28px] leading-tight text-ink">{total < 0 ? `+${NBSP}${money(-total)}` : money(total)}</p>
      </section>

      {entries.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir a lista.</h2><button type="button" onClick={() => void entries.refetch()} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button></div>
        : !data ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-16 animate-pulse rounded-2xl bg-line"/><div className="h-16 animate-pulse rounded-2xl bg-line"/></div>
        : data.items.length === 0 ? <p data-testid="text-dream-entries-empty" className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-[14px] leading-5 text-ink-soft">Nenhum aporte neste mês.</p>
        : <ul data-testid="list-dream-entries" className="enter mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" style={{ animationDelay: '.1s' }}>
          {data.items.map((item) => {
            const body = <>
              <span className="min-w-0"><span className="block truncate text-[16px] font-semibold text-ink">{item.dreamName}</span><span className="block text-[14px] text-ink-soft">{item.kind === 'deposit' ? 'Aporte' : 'Retirada'} · {dateLabel(item.date)}</span></span>
              <span className="shrink-0 font-mono-data text-[16px] text-ink">{item.kind === 'deposit' ? '−' : '+'}{NBSP}{money(item.amount)}</span>
            </>;
            return <li key={item.id}>{item.dreamArchived
              ? <div data-testid={`row-dream-entry-${item.id}`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">{body}</div>
              : <button type="button" data-testid={`row-dream-entry-${item.id}`} aria-label={`${item.dreamName}: abrir o sonho`} onClick={() => navigate(`/sonhos/${item.dreamId}`)} className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-hover">{body}</button>}</li>;
          })}
        </ul>}
    </div>
  </main>;
}
