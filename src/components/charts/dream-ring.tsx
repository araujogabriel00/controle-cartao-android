import { pct } from '@/components/dream-parts';
import { isHidden } from '@/lib/hide-values';

// Anel de progresso de um sonho (specs/sonhos.md RF-02, D13). `animate` desenha o arco em 900 ms na primeira exibição;
// com o olho fechado só fica a trilha, sem o formato que revelaria a proporção (RF-13).
export function DreamRing({ percent, size = 64, animate = false, testId, children }: {
  percent: number; size?: number; animate?: boolean; testId?: string; children?: React.ReactNode;
}) {
  const hidden = isHidden();
  const stroke = Math.max(5, Math.round(size / 10));
  const radius = (size - stroke) / 2;
  const shown = Math.max(0, Math.min(100, percent));
  const end = 100 - shown;
  return <div data-testid={testId} className="relative shrink-0" style={{ width: size, height: size }}>
    <svg role="img" aria-label={hidden ? 'Progresso escondido' : `${Math.round(percent)}% da meta`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-chart-track"/>
      {!hidden && shown > 0 && <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round" pathLength={100}
        strokeDasharray="100" strokeDashoffset={end} className={`stroke-chart-in ${animate ? 'dream-ring-arc' : ''}`} style={{ ['--ring-end' as string]: end }}/>}
    </svg>
    <span className="absolute inset-0 grid place-items-center text-center font-mono-data text-ink" style={{ fontSize: Math.max(13, Math.round(size / 4.2)) }}>
      {children ?? pct(percent)}
    </span>
  </div>;
}
