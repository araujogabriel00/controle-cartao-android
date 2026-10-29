import { capitalize, money, monthLabel } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const W = 150;
const H = 56;
const PAD_X = 6;
const PAD_Y = 6;
const DOT = 5;

export type SparkPoint = { month: string; value: number };

// Linha de 6 meses do painel Saldo (specs/inicio-com-minigraficos.md D3, RN-05): vai do menor ao maior valor com folga de 10%,
// sem escala escrita; área a 14% e o último ponto destacado com um anel de 2 px. Sem tooltip (D11).
export function Sparkline({ points, ariaLabel, caption, legend }: { points: SparkPoint[]; ariaLabel: string; caption: string; legend: string }) {
  if (isHidden()) return <div data-testid="chart-home-balance" className="w-[128px] shrink-0"><HiddenChart height={48}/><p className="mt-1 text-center text-[13px] text-ink-soft">{legend}</p></div>;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(Math.abs(max), 1);
  const low = min - spread * 0.1;
  const high = max + spread * 0.1;
  const x = (i: number) => PAD_X + (points.length === 1 ? (W - 2 * PAD_X) / 2 : (i * (W - 2 * PAD_X - DOT)) / (points.length - 1));
  const y = (value: number) => PAD_Y + (1 - (value - low) / (high - low)) * (H - 2 * PAD_Y);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const last = points[points.length - 1];
  return <div data-testid="chart-home-balance" className="enter w-[128px] shrink-0">
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
      <path d={area} className="fill-chart-in" fillOpacity={0.14}/>
      <path d={line} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-chart-in"/>
      <circle cx={x(points.length - 1)} cy={y(last.value)} r={DOT} strokeWidth={2} className="fill-chart-in stroke-surface"/>
    </svg>
    <p className="mt-1 text-center text-[13px] text-ink-soft">{legend}</p>
    <ChartTable caption={caption} head={['Mês', 'Saldo']} rows={points.map((p) => ({ label: capitalize(monthLabel(p.month)), value: money(p.value) }))}/>
  </div>;
}
