import { useLocation } from 'wouter';
import { getGetDreamPlanQueryKey, getGetDreamsQueryKey, useGetDreamPlan, useGetDreams, type DreamItem } from '@workspace/api-client-react';
import { ChevronRight, CircleHelp, Moon, Plus, Sparkles } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { leaveDreamScreen } from '@/lib/dream-nav';
import { DreamIconView, etaLabel, pct, ShareBar, SHARE_COLORS, useCountUp, useFirstShow } from '@/components/dream-parts';
import { DreamRing } from '@/components/charts/dream-ring';
import { money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';

function DreamRow({ item, animate, onOpen }: { item: DreamItem; animate: boolean; onOpen: () => void }) {
  const active = item.status === 'active';
  return <li>
    <button type="button" data-testid={`row-dream-${item.id}`} onClick={onOpen} aria-label={`${item.name}: ${money(item.saved)} de ${money(item.goal)}${isHidden() ? '' : `, ${Math.round(item.percent)}%`}. Abrir a caixinha.`}
      className="flex min-h-[88px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-hover">
      <DreamRing testId={`ring-dream-${item.id}`} percent={item.percent} size={64} animate={animate}/>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[16px] font-semibold text-ink"><span aria-hidden className="shrink-0 text-brand"><DreamIconView icon={item.icon} size={18}/></span><span className="min-w-0 truncate">{item.name}</span></span>
        <span className="block text-[14px] text-ink-soft">{money(item.saved)} de {money(item.goal)}</span>
        {active
          ? <span className="block text-[14px] text-ink-soft">{pct(item.effectiveShare)} da economia · {etaLabel(item.etaMonth)}</span>
          : <span className="block text-[14px] font-semibold text-brand">{item.status === 'closed' ? 'Encerrado' : 'Conquistado'}</span>}
        {item.almostThere && <span className="mt-1 inline-block rounded-full bg-tint px-2.5 py-0.5 text-[13px] font-semibold text-brand">Quase lá</span>}
      </span>
      <ChevronRight aria-hidden size={20} className="shrink-0 text-ink-soft"/>
    </button>
  </li>;
}

// specs/sonhos.md RF-01, RF-02, D15, RN-17: o plano, o que foi guardado no mês e a lista de sonhos.
export default function Sonhos() {
  const [, navigate] = useLocation();
  const dreams = useGetDreams({ query: { queryKey: getGetDreamsQueryKey(), refetchOnWindowFocus: true } });
  const plan = useGetDreamPlan({ query: { queryKey: getGetDreamPlanQueryKey(), refetchOnWindowFocus: true } });
  const animate = useFirstShow('sonhos');
  const percent = Math.round(useCountUp(plan.data?.percent ?? 0, animate));
  const items = dreams.data?.items ?? [];
  const open = items.filter((item) => item.status === 'active');
  const done = items.filter((item) => item.status !== 'active');
  const data = plan.data;

  const retry = () => { void dreams.refetch(); void plan.refetch(); };
  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={() => leaveDreamScreen(navigate, '/')}/>
      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-eyebrow"><Moon size={14}/><p className="font-mono-data text-xs uppercase tracking-[.08em]">Caixinhas para objetivos</p></div>
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">Meus sonhos</h1>
      </section>

      {dreams.isError || plan.isError ? <div data-testid="text-dreams-error" className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div>
        <h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir os sonhos.</h2>
        <button type="button" onClick={retry} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button>
      </div>
        : !dreams.data || !data ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[150px] animate-pulse rounded-2xl bg-line"/><div className="h-[88px] animate-pulse rounded-2xl bg-line"/></div>
        : items.length === 0 ? <section data-testid="section-dreams-empty" aria-label="Primeiros passos" className="enter mt-6">
          <p className="text-[15px] text-ink-soft">Cada sonho é uma caixinha com meta, ritmo e previsão de chegada.</p>
          <button type="button" data-testid="button-new-dream" onClick={() => navigate('/sonhos/novo')} className="mt-4 flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/>Criar meu primeiro sonho</button>
          <ol className="mt-6 space-y-2">
            {['Dê um nome ao sonho e diga quanto ele custa.', 'Escolha quanto da renda quer guardar por mês.', 'Guarde quando puder e veja a caixinha encher.'].map((text, index) => <li key={text} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint font-display text-[18px] text-brand">{index + 1}</span><span className="text-[15px] text-ink">{text}</span>
            </li>)}
          </ol>
        </section>
        : <>
          {open.length > 0 && <section data-testid="card-dreams-plan" aria-label="Plano" className="enter mt-5 rounded-[20px] border border-line bg-surface p-4" style={{ animationDelay: '.08s' }}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-medium text-ink-soft">Plano de economia</span>
                <p className="font-display text-[48px] leading-none tracking-[-.02em] text-ink">{isHidden() ? '••%' : `${percent}%`}</p>
                <p data-testid="text-dreams-monthly" className="mt-1 text-[15px] text-ink-soft">da renda · <span className="font-mono-data text-ink">{money(data.monthlyAmount)}</span> por mês</p>
              </div>
              <Sparkles aria-hidden size={28} className="shrink-0 text-brand"/>
            </div>
            {data.hasPlan && <div className="mt-4">
              <ShareBar shares={data.items}/>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-soft">
                {data.items.map((item, index) => <li key={item.id} className="flex items-center gap-1.5"><span aria-hidden className={`h-2.5 w-2.5 rounded-full ${SHARE_COLORS[index % SHARE_COLORS.length]}`}/>{item.name} {pct(item.share)}</li>)}
              </ul>
            </div>}
            <p data-testid="text-dreams-month" className="mt-3 text-[15px] text-ink">{data.savedThisMonth < 0
              // Retiradas maiores que os aportes (ex.: "Usar o dinheiro"): "guardou -R$ X" confunde, então a frase vira "retirou".
              ? <>Neste mês você retirou <span className="font-mono-data font-semibold">{money(-data.savedThisMonth)}</span> das caixinhas</>
              : <>Neste mês você guardou <span className="font-mono-data font-semibold">{money(data.savedThisMonth)}</span> de <span className="font-mono-data">{money(data.monthlyAmount)}</span></>}</p>
            <button type="button" data-testid="button-adjust-plan" onClick={() => navigate('/sonhos/plano')} className="-mx-2 mt-1 flex h-12 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-brand transition hover:bg-hover">{data.hasPlan ? 'Ajustar plano' : 'Definir plano'}<ChevronRight size={16}/></button>
          </section>}

          {open.length > 0 && <ul data-testid="list-dreams" className="enter mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" style={{ animationDelay: '.12s' }}>
            {open.map((item) => <DreamRow key={item.id} item={item} animate={animate} onOpen={() => navigate(`/sonhos/${item.id}`)}/>)}
          </ul>}

          <button type="button" data-testid="button-new-dream" onClick={() => navigate('/sonhos/novo')} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/>Novo sonho</button>

          {done.length > 0 && <section aria-label="Conquistados" className="enter mt-8" style={{ animationDelay: '.16s' }}>
            <h2 className="font-display text-[20px] text-ink">Conquistados</h2>
            <ul data-testid="list-dreams-done" className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {done.map((item) => <DreamRow key={item.id} item={item} animate={false} onOpen={() => navigate(item.status === 'reached' ? `/sonhos/${item.id}/conquista` : `/sonhos/${item.id}`)}/>)}
            </ul>
          </section>}
        </>}
    </div>
  </main>;
}
