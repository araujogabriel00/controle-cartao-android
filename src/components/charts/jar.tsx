import { useId } from 'react';
import { prefersReducedMotion } from '@/components/dream-parts';
import { isHidden } from '@/lib/hide-values';

// A caixinha de um sonho (specs/sonhos.md RF-05, D13): um frasco que enche até o percentual, com onda no topo e,
// ao guardar, moedas caindo. Com o olho fechado é um frasco vazio e neutro (RF-13).
const BODY = 'M30 18 h64 v10 q12 6 12 20 v58 q0 16 -16 16 h-56 q-16 0 -16 -16 v-58 q0 -14 12 -20 z';
const TOP = 30;
const BOTTOM = 124;

export function Jar({ percent, size = 124, animate = false, coins = false, testId }: {
  percent: number; size?: number; animate?: boolean; coins?: boolean; testId?: string;
}) {
  const clip = useId();
  const hidden = isHidden();
  const level = hidden ? 0 : Math.max(0, Math.min(100, percent));
  const height = ((BOTTOM - TOP) * level) / 100;
  const y = BOTTOM - height;
  return <div data-testid={testId} className="relative mx-auto" style={{ width: size, height: size * (130 / 124) }}>
    <svg role="img" aria-label={hidden ? 'Caixinha escondida' : `Caixinha com ${Math.round(percent)}% da meta`} viewBox="0 0 124 130" className="block h-full w-full">
      <defs><clipPath id={clip}><path d={BODY}/></clipPath></defs>
      <path d={BODY} className="fill-chart-track"/>
      {level > 0 && <g clipPath={`url(#${clip})`}>
        <g className={animate ? 'dream-jar-level' : ''}>
          <rect x={0} y={y} width={124} height={height + 2} className="fill-chart-in"/>
          <path d={`M0 ${y} q15.5 -6 31 0 t31 0 t31 0 t31 0 v6 h-124 z`} className="fill-chart-in opacity-70"/>
        </g>
      </g>}
      <path d={BODY} fill="none" strokeWidth={3} className="stroke-ink-soft"/>
      <rect x={26} y={10} width={72} height={9} rx={4} className="fill-ink-soft"/>
    </svg>
    {coins && !hidden && !prefersReducedMotion() && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="dream-coin absolute top-0 h-4 w-4 rounded-full bg-chart-violet" style={{ left: `${30 + i * 12}%`, animationDelay: `${i * 0.3}s` }}/>)}
    </div>}
  </div>;
}
