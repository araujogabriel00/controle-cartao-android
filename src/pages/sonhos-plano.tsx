import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getGetDreamPlanQueryKey, useGetDreamPlan, useSaveDreamPlan, type DreamPlan } from '@workspace/api-client-react';
import { Check, CircleHelp, Minus, Plus } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { leaveDreamScreen } from '@/lib/dream-nav';
import { DreamIconView, pct, ShareBar } from '@/components/dream-parts';
import { money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';

const CHIPS = [10, 15, 20, 25, 30];
const STEP = 5;
const cents = (value: number) => Math.round(value * 100) / 100;

function PlanEditor({ plan }: { plan: DreamPlan }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const [percent, setPercent] = useState(plan.percent);
  const [shares, setShares] = useState<Record<number, number>>(() => Object.fromEntries(plan.items.map((item) => [item.id, item.share])));
  const [error, setError] = useState<string | null>(null);
  const save = useSaveDreamPlan({ mutation: { onSuccess: () => { void client.invalidateQueries(); leaveDreamScreen(navigate, '/sonhos'); }, onError: (e) => setError(e.message) } });

  const total = plan.items.reduce((sum, item) => sum + (shares[item.id] ?? 0), 0);
  const ok = plan.items.length === 0 || total === 100;
  const monthly = cents((plan.referenceIncome * percent) / 100);
  const leftover = cents(plan.referenceIncome - monthly - plan.invoiceAmount);
  // "+" e "−" vão ao próximo múltiplo de 5 (de 38, "+" dá 40 e "−" dá 35): com passo fixo, partes como 38/37/25 nunca chegariam a 40/35/25.
  const change = (id: number, delta: number) => setShares((current) => {
    const value = current[id] ?? 0;
    const next = delta > 0 ? (Math.floor(value / STEP) + 1) * STEP : (Math.ceil(value / STEP) - 1) * STEP;
    return { ...current, [id]: Math.max(1, Math.min(100, next)) };
  });
  const stepButton = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-ink transition hover:bg-hover';

  return <>
    <section className="enter mt-5" style={{ animationDelay: '.08s' }}>
      <p data-testid="text-plan-percent" className="font-display text-[56px] leading-none tracking-[-.02em] text-ink">{isHidden() ? '••%' : `${percent}%`}</p>
      <p data-testid="text-plan-monthly" className="mt-1 text-[16px] text-ink-soft"><span className="font-mono-data text-ink">{money(monthly)}</span> por mês</p>
      <label htmlFor="slider-plan-percent" className="sr-only">Percentual da renda a guardar por mês</label>
      <input id="slider-plan-percent" data-testid="slider-plan-percent" type="range" min={0} max={50} step={1} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="mt-4 h-12 w-full accent-brand"/>
      <div className="mt-1 flex flex-wrap gap-2">
        {CHIPS.map((chip) => <button key={chip} type="button" data-testid={`button-plan-chip-${chip}`} aria-pressed={percent === chip} onClick={() => setPercent(chip)}
          className={`h-12 min-w-12 flex-1 basis-0 rounded-full border px-3 text-[15px] font-semibold transition ${percent === chip ? 'border-brand bg-brand text-on-brand' : 'border-line text-ink hover:bg-hover'}`}>{chip}%</button>)}
      </div>
      <p data-testid="text-plan-leftover" className="mt-4 rounded-2xl bg-tint px-4 py-3 text-[15px] leading-5 text-ink">
        {plan.referenceIncome > 0
          ? <>Depois de guardar e pagar os cartões, sobram <span className="font-mono-data font-semibold">{money(leftover)}</span> para o mês.</>
          : 'Sem renda registrada ainda: lance uma entrada para ver quanto sobra.'}
      </p>
    </section>

    {plan.items.length > 0 && <section aria-label="Divisão entre os sonhos" className="enter mt-6" style={{ animationDelay: '.12s' }}>
      <h2 className="font-display text-[20px] text-ink">Como dividir</h2>
      <div className="mt-2"><ShareBar shares={plan.items.map((item) => ({ id: item.id, share: shares[item.id] ?? 0 }))}/></div>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {plan.items.map((item) => <li key={item.id} data-testid={`row-plan-${item.id}`} className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><DreamIconView icon={item.icon}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold text-ink">{item.name}</span><span data-testid={`text-plan-share-${item.id}`} className="block font-mono-data text-[14px] text-ink-soft">{pct(shares[item.id] ?? 0)}</span></span>
          <button type="button" data-testid={`button-plan-minus-${item.id}`} aria-label={`Diminuir a parte de ${item.name}`} onClick={() => change(item.id, -STEP)} className={stepButton}><Minus size={18}/></button>
          <button type="button" data-testid={`button-plan-plus-${item.id}`} aria-label={`Aumentar a parte de ${item.name}`} onClick={() => change(item.id, STEP)} className={stepButton}><Plus size={18}/></button>
        </li>)}
      </ul>
      <p data-testid="text-plan-total" role="status" className={`mt-3 flex items-center gap-2 text-[15px] font-semibold ${ok ? 'text-brand' : 'text-alert'}`}>
        {ok && <Check aria-hidden size={18}/>}Total: {pct(total)}{!ok && (total > 100 ? ` · passou ${isHidden() ? '••' : total - 100}%` : ` · faltam ${isHidden() ? '••' : 100 - total}%`)}
      </p>
    </section>}

    {error && <p role="alert" data-testid="text-form-error" className="mt-4 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
    <button type="button" data-testid="button-save-plan" disabled={!ok || save.isPending} onClick={() => { setError(null); save.mutate({ data: { percent, shares: plan.items.map((item) => ({ dreamId: item.id, share: shares[item.id] ?? 0 })) } }); }}
      className="mt-6 h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-50">{save.isPending ? 'Salvando…' : 'Salvar plano'}</button>
  </>;
}

// specs/sonhos.md RF-03, D3: o percentual da renda, a sobra do mês e a divisão entre os sonhos ativos (soma 100%).
export default function SonhosPlano() {
  const [, navigate] = useLocation();
  const plan = useGetDreamPlan({ query: { queryKey: getGetDreamPlanQueryKey() } });
  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => leaveDreamScreen(navigate, '/sonhos')}/>
      <h1 className="enter mt-3 font-display text-[28px] leading-tight text-ink">Plano de economia</h1>
      {plan.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir o plano.</h2><button type="button" onClick={() => void plan.refetch()} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button></div>
        : !plan.data ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[180px] animate-pulse rounded-2xl bg-line"/><div className="h-[160px] animate-pulse rounded-2xl bg-line"/></div>
        : <PlanEditor plan={plan.data}/>}
    </div>
  </main>;
}
