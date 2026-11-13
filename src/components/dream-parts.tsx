import { useEffect, useState } from 'react';
import { BookOpen, Laptop, type LucideIcon, Plane, ShieldCheck, Star, Target } from 'lucide-react';
import { HiddenChart } from '@/components/charts/chart-table';
import { money, type MonthKey } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import type { DreamIcon, DreamSavingWindow } from '@workspace/api-client-react';

// Peças comuns das telas de Caixinhas (specs/sonhos.md).
export const DREAM_ICON_VIEW: Record<DreamIcon, { icon: LucideIcon; label: string }> = {
  plane: { icon: Plane, label: 'Viagem' },
  shield: { icon: ShieldCheck, label: 'Reserva' },
  laptop: { icon: Laptop, label: 'Tecnologia' },
  book: { icon: BookOpen, label: 'Estudo' },
  target: { icon: Target, label: 'Meta' },
  star: { icon: Star, label: 'Estrela' },
};

export function DreamIconView({ icon, size = 24 }: { icon: DreamIcon; size?: number }) {
  const Icon = DREAM_ICON_VIEW[icon]?.icon ?? Star;
  return <Icon aria-hidden size={size}/>;
}

// RN-13: com o olho fechado percentuais viram "••".
export const pct = (value: number) => (isHidden() ? '••%' : `${Math.round(value)}%`);

// "dez/2029" (D4); sem previsão, "—".
export function etaLabel(month: MonthKey | null) {
  if (!month) return '—';
  const [year, index] = month.split('-').map(Number);
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, index - 1, 1)).replace('.', '');
  return `${name}/${year}`;
}

// D13: com `prefers-reduced-motion` (ou sem matchMedia) tudo aparece já no estado final.
export const prefersReducedMotion = () =>
  typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// D13: a animação vale só na primeira exibição de cada tela, na sessão.
const seen = new Set<string>();
export function useFirstShow(screen: string) {
  const [first] = useState(() => {
    if (seen.has(screen)) return false;
    seen.add(screen);
    return !prefersReducedMotion() && !isHidden();
  });
  return first;
}

// D13: contagem de 700 ms até o valor; sem animação devolve o valor na hora.
export function useCountUp(target: number, animate: boolean, duration = 700) {
  const [value, setValue] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) { setValue(target); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(target * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate, duration]);
  return animate ? value : target;
}

// Confete preso à área da tela (queda de 210 px com fade). Só com animação; nunca com o olho fechado.
const CONFETTI_COLORS = ['bg-chart-in', 'bg-chart-violet', 'bg-chart-rose', 'bg-brand'];
export function Confetti({ pieces = 24 }: { pieces?: number }) {
  if (prefersReducedMotion() || isHidden()) return null;
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[230px] overflow-hidden">
    {Array.from({ length: pieces }, (_, i) => <span key={i} className={`dream-confetti absolute top-0 h-2.5 w-1.5 rounded-sm ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.12}s` }}/>)}
  </div>;
}

// Barra empilhada da divisão do plano (RF-01): uma cor por caixinha; com o olho fechado, uma barra neutra.
export const SHARE_COLORS = ['bg-chart-in', 'bg-chart-violet', 'bg-chart-rose'];
export function ShareBar({ shares }: { shares: { id: number; share: number }[] }) {
  if (isHidden()) return <HiddenChart height={16}/>;
  return <div aria-hidden data-testid="chart-dream-shares" className="flex h-4 gap-0.5 overflow-hidden rounded">
    {shares.map((item, index) => <span key={item.id} className={`h-full ${SHARE_COLORS[index % SHARE_COLORS.length]}`} style={{ width: `${item.share}%` }}/>)}
  </div>;
}

const ddmm = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

// caixinhas-quando-guardar D3: a resposta e a linha de apoio do cartão (os valores em reais mascaram com o olho fechado).
export function savingAnswer(w: DreamSavingWindow): { answer: string; support: string | null } {
  const room = w.todayRoom > 0 ? `Hoje cabem ${money(w.todayRoom)}.` : 'Hoje não cabe nada.';
  if (w.state === 'now') return { answer: 'Pode guardar agora', support: room };
  if (w.state === 'later') return { answer: `A partir de ${ddmm(w.releaseDate!)}`, support: room };
  if (w.state === 'never') return { answer: 'Ainda não nos próximos 30 dias', support: room };
  return { answer: 'Meta do mês cumprida', support: null };
}

// D4: um segmento por dia da janela. Laranja e mais baixo = ainda não; azul e mais alto = pode guardar; a legenda e a resposta dizem o mesmo em texto.
export function DayStrip({ days, label }: { days: { date: string; ok: boolean }[]; label: string }) {
  const first = days.findIndex((d) => d.ok);
  const showRelease = first > 3 && first < days.length - 4;
  return <div className="mt-3">
    <div role="img" aria-label={label} data-testid="chart-saving-days" className="flex h-[14px] items-end gap-0.5">
      {days.map((d) => <span key={d.date} data-ok={d.ok} className={`min-w-0 flex-1 rounded-full ${d.ok ? 'h-full bg-chart-in' : 'h-2.5 bg-chart-out'}`}/>)}
    </div>
    <div aria-hidden className="relative mt-1 flex justify-between text-[13px] text-ink-soft">
      <span>hoje</span>
      {showRelease && <span className="absolute -translate-x-1/2 font-semibold text-ink" style={{ left: `${(first / (days.length - 1)) * 100}%` }}>{ddmm(days[first].date)}</span>}
      <span>{ddmm(days[days.length - 1].date)}</span>
    </div>
    <p aria-hidden className="mt-1 flex gap-4 text-[13px] text-ink-soft">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-out"/>ainda não</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-in"/>pode guardar</span>
    </p>
  </div>;
}
