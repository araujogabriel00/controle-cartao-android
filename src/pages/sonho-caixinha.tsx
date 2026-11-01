import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocation } from 'wouter';
import {
  getGetDreamQueryKey, getGetMonthCashQueryKey, useDeleteDream, useDepositDream, useGetDream, useGetMonthCash, useWithdrawDream,
  type DreamDeposit, type DreamDetail,
} from '@workspace/api-client-react';
import { BackButton } from '@/components/back-button';
import { leaveDreamScreen } from '@/lib/dream-nav';
import { useConfirm } from '@/components/confirm-dialog';
import { Jar } from '@/components/charts/jar';
import { DreamIconView, etaLabel, pct, useCountUp, useFirstShow } from '@/components/dream-parts';
import { MoneySheet } from '@/components/dream-sheets';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { currentMonth, dateLabel, money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';

const NBSP = ' ';
const ENTRY_LABEL = { initial: 'Guardado inicial', deposit: 'Aporte', withdraw: 'Retirada' } as const;
const MILESTONE_TEXT = { 25: 'Primeiro quarto da meta!', 50: 'Metade do caminho!', 75: 'Faltam só 25%!' } as const;

// RF-07: a tela "Guardado!" com a caixinha enchendo, moedas, o valor, o total, o marco e "Voltar ao sonho".
function SavedScreen({ dream, result, onBack }: { dream: DreamDetail; result: DreamDeposit; onBack: () => void }) {
  const animate = useFirstShow(`guardado-${dream.id}-${result.saved}`);
  const total = useCountUp(result.saved, animate);
  return <main data-testid="screen-dream-saved" className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto flex min-h-safe max-w-[440px] flex-col items-center px-4 pb-10 pt-12 text-center">
      <h1 className="font-display text-[32px] leading-tight text-ink">Guardado!</h1>
      <div className="mt-6"><Jar percent={result.percent} size={150} animate={animate} coins={animate}/></div>
      <p data-testid="text-saved-amount" className="dream-pop mt-6 font-display text-[40px] leading-none text-ink">+{NBSP}{money(result.amount)}</p>
      <p className="mt-2 text-[16px] text-ink-soft">Total guardado em {dream.name}: <span data-testid="text-saved-total" className="font-mono-data text-ink">{money(total)}</span> de {money(dream.goal)}</p>
      {result.milestone && !isHidden() && <p data-testid="text-milestone" role="status" className="mt-4 rounded-full bg-tint px-4 py-2 text-[15px] font-semibold text-brand">{MILESTONE_TEXT[result.milestone]}</p>}
      <button type="button" data-testid="button-back-to-dream" onClick={onBack} className="mt-auto h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover">Voltar ao sonho</button>
    </div>
  </main>;
}

function Caixinha({ dream }: { dream: DreamDetail }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const confirm = useConfirm();
  const [sheet, setSheet] = useState<'deposit' | 'withdraw' | null>(null);
  const [saved, setSaved] = useState<DreamDeposit | null>(null);
  const { notice, notify, failed, formError } = useNotice(sheet !== null);
  const animate = useFirstShow(`caixinha-${dream.id}`);
  const cash = useGetMonthCash(currentMonth(), { query: { queryKey: getGetMonthCashQueryKey(currentMonth()) } });
  const balance = cash.data?.balanceAmount ?? 0;
  const refresh = () => { void client.invalidateQueries(); };
  const deposit = useDepositDream({
    mutation: {
      onSuccess: async (result) => {
        // A conquista lê o sonho de novo: espera a leitura atualizada para a tela não abrir com o sonho ainda "ativo".
        await client.invalidateQueries();
        setSheet(null);
        if (result.reached) navigate(`/sonhos/${dream.id}/conquista`, { replace: true }); else setSaved(result);
      },
      onError: failed,
    },
  });
  const withdraw = useWithdrawDream({ mutation: { onSuccess: () => { refresh(); setSheet(null); notify('Dinheiro devolvido ao saldo.'); }, onError: failed } });
  const remove = useDeleteDream({ mutation: { onSuccess: () => { refresh(); leaveDreamScreen(navigate, '/sonhos'); }, onError: failed } });
  const shownSaved = useCountUp(dream.saved, animate);

  if (saved) return <SavedScreen dream={dream} result={saved} onBack={() => setSaved(null)}/>;

  const closed = dream.status === 'closed';
  const askDelete = async () => {
    const text = dream.saved > 0 ? `Os ${money(dream.saved)} guardados voltam para o seu saldo. Os aportes antigos continuam nas contas dos meses em que aconteceram.` : 'Este sonho ainda não tem dinheiro guardado.';
    if (await confirm({ title: `Excluir ${dream.name}?`, text, confirmLabel: 'Excluir sonho' })) remove.mutate({ dreamId: dream.id });
  };
  // Em telas estreitas (360 px) os três indicadores viram linhas; a partir de 420 px ficam lado a lado.
  const indicator = 'flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 min-[420px]:block min-[420px]:px-3';

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <div className="flex items-center justify-between">
        <BackButton onClick={() => leaveDreamScreen(navigate, '/sonhos')}/>
        <RowMenu title={dream.name} menuTestId="menu-dream" editTestId="button-edit-dream" deleteTestId="button-delete-dream" deleteLabel="Excluir sonho" onEdit={() => navigate(`/sonhos/${dream.id}/editar`)} onDelete={() => void askDelete()}/>
      </div>
      <section className="enter mt-1 flex items-center gap-3" style={{ animationDelay: '.06s' }}>
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tint text-brand"><DreamIconView icon={dream.icon} size={26}/></span>
        <h1 data-testid="text-dream-name" className="min-w-0 font-display text-[28px] leading-tight text-ink [overflow-wrap:anywhere]">{dream.name}</h1>
      </section>

      <section data-testid="card-dream-jar" aria-label="Caixinha" className="enter mt-5 rounded-[20px] border border-line bg-surface px-4 py-6 text-center" style={{ animationDelay: '.1s' }}>
        <Jar percent={dream.percent} size={124} animate={animate}/>
        <p className="mt-3 font-display text-[34px] leading-none text-ink">{pct(dream.percent)}</p>
        <p className="mt-2 text-[15px] text-ink-soft">Guardado <span data-testid="text-dream-saved" className="font-mono-data text-ink">{money(shownSaved)}</span> de {money(dream.goal)}</p>
        {dream.almostThere && <span className="mt-2 inline-block rounded-full bg-tint px-3 py-0.5 text-[14px] font-semibold text-brand">Quase lá</span>}
        {closed && <span className="mt-2 inline-block rounded-full bg-tint px-3 py-0.5 text-[14px] font-semibold text-brand">Encerrado</span>}
      </section>

      <dl className="enter mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3" style={{ animationDelay: '.14s' }}>
        <div className={indicator}><dt className="text-[13px] text-ink-soft">Ritmo</dt><dd data-testid="text-dream-pace" className="font-mono-data text-[14px] text-ink [overflow-wrap:anywhere]">{dream.pace ? `${money(dream.pace)}/mês` : '—'}</dd></div>
        <div className={indicator}><dt className="text-[13px] text-ink-soft">Faltam</dt><dd data-testid="text-dream-remaining" className="font-mono-data text-[14px] text-ink [overflow-wrap:anywhere]">{money(dream.remaining)}</dd></div>
        <div className={indicator}><dt className="text-[13px] text-ink-soft">Previsão</dt><dd data-testid="text-dream-eta" className="font-mono-data text-[14px] text-ink">{etaLabel(dream.etaMonth)}</dd></div>
      </dl>

      {dream.status === 'reached' && <button type="button" data-testid="button-dream-decide" onClick={() => navigate(`/sonhos/${dream.id}/conquista`, { replace: true })} className="mt-4 h-14 w-full rounded-full border-2 border-brand text-base font-semibold text-brand transition hover:bg-hover">Escolher o que fazer com o dinheiro</button>}
      {!closed && <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" data-testid="button-save-money" onClick={() => setSheet('deposit')} className="h-14 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover">Guardar agora</button>
        <button type="button" data-testid="button-withdraw" disabled={dream.saved <= 0} onClick={() => setSheet('withdraw')} className="h-14 rounded-full border border-line px-6 text-base font-semibold text-ink transition hover:bg-hover disabled:opacity-50">Retirar</button>
      </div>}

      <section aria-label="Últimos aportes" className="enter mt-8" style={{ animationDelay: '.18s' }}>
        <h2 className="font-display text-[20px] text-ink">Últimos aportes</h2>
        <ul data-testid="list-dream-entries" className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {dream.entries.map((entry) => <li key={entry.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{ENTRY_LABEL[entry.kind]}</span><span className="block text-[14px] text-ink-soft">{dateLabel(entry.date)}</span></span>
            <span className="shrink-0 font-mono-data text-[15px] text-ink">{entry.kind === 'withdraw' ? '−' : '+'}{NBSP}{money(entry.amount)}</span>
          </li>)}
          {dream.entries.length === 0 && <li className="px-4 py-5 text-center text-[14px] text-ink-soft">Nenhum aporte ainda.</li>}
        </ul>
      </section>
    </div>

    {sheet && <MoneySheet kind={sheet} dream={dream} balance={balance} busy={deposit.isPending || withdraw.isPending} error={formError} onClose={() => setSheet(null)}
      onSave={(amount) => (sheet === 'deposit' ? deposit.mutate({ dreamId: dream.id, amount }) : withdraw.mutate({ dreamId: dream.id, amount }))}/>}
    <Notice notice={notice}/>
  </main>;
}

// specs/sonhos.md RF-05 a RF-08: a caixinha do sonho com Guardar agora, Retirar e os últimos aportes.
export default function SonhoCaixinha({ dreamId }: { dreamId: number }) {
  const dream = useGetDream(dreamId, { query: { queryKey: getGetDreamQueryKey(dreamId), refetchOnWindowFocus: true } });
  const [, navigate] = useLocation();
  if (dream.isError) return <Redirect to="/sonhos" replace />;
  if (!dream.data) return <main className="notebook-grain min-h-safe bg-paper"><div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5"><BackButton onClick={() => leaveDreamScreen(navigate, '/sonhos')}/><div aria-busy="true" className="mt-6 h-[300px] animate-pulse rounded-2xl bg-line"/></div></main>;
  return <Caixinha dream={dream.data}/>;
}

