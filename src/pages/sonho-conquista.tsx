import { leaveDreamScreen } from '@/lib/dream-nav';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocation } from 'wouter';
import { getGetDreamQueryKey, useCloseDream, useGetDream } from '@workspace/api-client-react';
import { Notice, useNotice } from '@/components/notice';
import { Confetti, DreamIconView, useFirstShow } from '@/components/dream-parts';
import { DreamRing } from '@/components/charts/dream-ring';
import { money } from '@/lib/format';

// specs/sonhos.md RF-09, D9: a comemoração e a escolha entre usar o dinheiro e manter guardado.
export default function SonhoConquista({ dreamId }: { dreamId: number }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const { notice, failed } = useNotice();
  const dream = useGetDream(dreamId, { query: { queryKey: getGetDreamQueryKey(dreamId) } });
  const animate = useFirstShow(`conquista-${dreamId}`);
  const close = useCloseDream({ mutation: { onSuccess: () => { void client.invalidateQueries(); leaveDreamScreen(navigate, '/sonhos'); }, onError: failed } });

  if (dream.isError) return <Redirect to="/sonhos" replace />;
  if (!dream.data || (dream.isFetching && dream.data.status !== 'reached')) return <main className="notebook-grain min-h-safe bg-paper"><div aria-busy="true" className="mx-auto mt-24 h-[300px] max-w-[440px] animate-pulse rounded-2xl bg-line"/></main>;
  const item = dream.data;
  // Sem conquista aberta (ainda ativo ou já encerrado) não há o que decidir aqui.
  if (item.status !== 'reached') return <Redirect to={item.status === 'closed' ? '/sonhos' : `/sonhos/${dreamId}`} replace />;

  return <main data-testid="screen-dream-done" className="notebook-grain relative min-h-safe overflow-hidden bg-paper text-ink">
    <Confetti/>
    <div className="relative z-10 mx-auto flex min-h-safe max-w-[440px] flex-col items-center px-4 pb-10 pt-16 text-center">
      <div className={animate ? 'dream-pop' : ''}><DreamRing percent={100} size={150}><span className="text-brand"><DreamIconView icon={item.icon} size={56}/></span></DreamRing></div>
      <h1 className="mt-6 font-display text-[30px] leading-tight text-ink">Você conquistou o {item.name}!</h1>
      <p className="mt-2 text-[16px] text-ink-soft">A caixinha chegou a <span className="font-mono-data text-ink">{money(item.saved)}</span>. O que você quer fazer com o dinheiro?</p>
      <div className="mt-auto w-full space-y-3 pt-10">
        <button type="button" data-testid="button-use-money" disabled={close.isPending} onClick={() => close.mutate({ dreamId, choice: 'use' })} className="h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">Usar o dinheiro</button>
        <p className="text-[14px] text-ink-soft">O valor volta ao saldo e vira um gasto do dia a dia de hoje.</p>
        <button type="button" data-testid="button-keep-saved" disabled={close.isPending} onClick={() => close.mutate({ dreamId, choice: 'keep' })} className="h-14 w-full rounded-full border border-line px-4 text-base font-semibold text-ink transition hover:bg-hover disabled:opacity-60">Manter guardado</button>
      </div>
    </div>
    <Notice notice={notice}/>
  </main>;
}
