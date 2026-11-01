import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocation } from 'wouter';
import {
  DREAM_ICONS, getGetDreamPlanQueryKey, getGetDreamQueryKey, useCreateDream, useGetDream, useGetDreamPlan, useUpdateDream,
  type DreamDetail, type DreamIcon, type DreamPlan,
} from '@workspace/api-client-react';
import { BackButton } from '@/components/back-button';
import { leaveDreamScreen } from '@/lib/dream-nav';
import { DREAM_ICON_VIEW, DreamIconView, etaLabel } from '@/components/dream-parts';
import { currentMonth, shiftMonth } from '@/lib/format';

function DreamForm({ dream, plan }: { dream?: DreamDetail; plan?: DreamPlan }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const isEdit = Boolean(dream);
  const [name, setName] = useState(dream?.name ?? '');
  const [goal, setGoal] = useState(dream ? String(dream.goal) : '');
  const [initial, setInitial] = useState('');
  const [icon, setIcon] = useState<DreamIcon>(dream?.icon ?? 'plane');
  // Com outros sonhos ativos, sugere uma parte igual para todos (100 seria recusado: os outros precisam de pelo menos 1%).
  const [share, setShare] = useState(dream ? String(dream.share) : String(plan?.items.length ? Math.floor(100 / (plan.items.length + 1)) : 100));
  const [error, setError] = useState<string | null>(null);
  const done = (path: string) => () => { void client.invalidateQueries(); leaveDreamScreen(navigate, path); };
  const fail = (e: Error) => setError(e.message);
  const create = useCreateDream({ mutation: { onSuccess: done('/sonhos'), onError: fail } });
  const update = useUpdateDream({ mutation: { onSuccess: done(dream ? `/sonhos/${dream.id}` : '/sonhos'), onError: fail } });
  const busy = create.isPending || update.isPending;

  // RF-04: a previsão na hora, com o ritmo da renda de referência no plano (D4).
  const goalValue = Number(goal);
  const initialValue = Number(initial || 0);
  const shareValue = Number(share);
  const missing = Number.isFinite(goalValue) ? Math.max(0, goalValue - (isEdit ? dream!.saved : initialValue)) : 0;
  const pace = plan && plan.referenceIncome > 0 && plan.percent > 0 && shareValue > 0 ? (plan.referenceIncome * plan.percent * shareValue) / 10000 : 0;
  const eta = pace > 0 && missing > 0 ? shiftMonth(currentMonth(), Math.ceil(missing / pace - 1e-9)) : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const data = { name, goal: goalValue, icon, share: shareValue };
    if (dream) update.mutate({ dreamId: dream.id, data });
    else create.mutate({ data: { ...data, initial: initialValue } });
  };

  return <form data-testid="form-dream" onSubmit={submit} className="mt-5 pb-28">
    <label htmlFor="input-dream-name" className="field-label">Nome do sonho</label>
    <input id="input-dream-name" data-testid="input-dream-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Viagem ao Japão" className="field-input mb-4"/>

    <label htmlFor="input-dream-goal" className="field-label">Quanto custa</label>
    <div className="relative mb-4"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span>
      <input id="input-dream-goal" data-testid="input-dream-goal" required type="number" min="0.01" step="0.01" inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="0,00" className="field-input pl-12"/>
    </div>

    {!isEdit && <>
      <label htmlFor="input-dream-initial" className="field-label">Já guardado</label>
      <div className="relative"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span>
        <input id="input-dream-initial" data-testid="input-dream-initial" type="number" min="0" step="0.01" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0,00" className="field-input pl-12"/>
      </div>
      <p className="mb-4 mt-1 text-[14px] text-ink-soft">Dinheiro que você já tinha separado: não sai do saldo.</p>
    </>}

    <span id="dream-icon-label" className="field-label">Ícone</span>
    <div role="group" aria-labelledby="dream-icon-label" className="mb-4 grid grid-cols-3 gap-2 min-[400px]:grid-cols-6">
      {DREAM_ICONS.map((value) => <button key={value} type="button" data-testid={`button-dream-icon-${value}`} aria-pressed={icon === value} aria-label={DREAM_ICON_VIEW[value].label} onClick={() => setIcon(value)}
        className={`grid h-12 place-items-center rounded-2xl border transition ${icon === value ? 'border-brand bg-tint text-brand' : 'border-line text-ink-soft hover:bg-hover'}`}><DreamIconView icon={value}/></button>)}
    </div>

    <label htmlFor="input-dream-share" className="field-label">Parte da economia (%)</label>
    <input id="input-dream-share" data-testid="input-dream-share" required type="number" min="1" max="100" step="1" inputMode="numeric" value={share} onChange={(e) => setShare(e.target.value)} className="field-input"/>
    <p className="mb-4 mt-1 text-[14px] text-ink-soft">Quanto do que você guarda por mês vai para este sonho. Os outros se ajustam.</p>

    <p data-testid="text-dream-preview" className="rounded-2xl bg-tint px-4 py-3 text-[15px] text-ink">Previsão de chegada: <span className="font-semibold">{etaLabel(eta)}</span>{!eta && ' (defina o plano para ver)'}</p>

    {error && <p role="alert" data-testid="text-form-error" className="mt-4 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <button data-testid="button-save-dream" disabled={busy} type="submit" className="mx-auto block h-14 w-full max-w-[440px] rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar sonho' : 'Criar sonho'}</button>
    </div>
  </form>;
}

// specs/sonhos.md RF-04 (novo sonho) e D10 (editar nome, ícone, meta e parte).
export default function SonhoNovo({ dreamId }: { dreamId?: number }) {
  const [, navigate] = useLocation();
  const plan = useGetDreamPlan({ query: { queryKey: getGetDreamPlanQueryKey() } });
  const dream = useGetDream(dreamId ?? 0, { query: { queryKey: getGetDreamQueryKey(dreamId ?? 0), enabled: dreamId !== undefined } });
  if (dreamId !== undefined && dream.isError) return <Redirect to="/sonhos" replace />;
  const ready = (dreamId === undefined || Boolean(dream.data)) && (Boolean(plan.data) || plan.isError);
  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <BackButton onClick={() => leaveDreamScreen(navigate, dreamId === undefined ? '/sonhos' : `/sonhos/${dreamId}`)}/>
      <h1 className="enter mt-3 font-display text-[28px] leading-tight text-ink">{dreamId === undefined ? 'Novo sonho' : 'Editar sonho'}</h1>
      {ready ? <DreamForm dream={dream.data} plan={plan.data}/> : <div aria-busy="true" className="mt-6 h-[300px] animate-pulse rounded-2xl bg-line"/>}
    </div>
  </main>;
}
