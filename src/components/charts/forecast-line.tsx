import { money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { balanceScale, tickLabel } from '@/components/charts/balance-line';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const W = 358;
const H = 170;
const LEFT = 2;
const RIGHT = 6;
const TOP = 14;
const BOTTOM = 26;

export type ForecastPoint = { date: string; balance: number };

const label = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

// Saldo previsto dia a dia, de hoje a +21 dias (specs/previsoes.md D11, RF-09): hoje é o ponto cheio (real) e o resto é a linha
// tracejada (previsto), que só muda nos dias em que uma previsão que mexe no saldo cai. Com o olho fechado vira uma faixa neutra.
export function ForecastLine({ points }: { points: ForecastPoint[] }) {
  const caption = 'Saldo previsto por dia';
  const rows = points.filter((p, i) => i === 0 || p.balance !== points[i - 1].balance || i === points.length - 1).map((p) => ({ label: label(p.date), value: money(p.balance) }));
  if (isHidden()) return <div data-testid="chart-balance-forecast" className="max-w-[440px]"><HiddenChart height={H}/><ChartTable caption={caption} head={['Dia', 'Saldo']} rows={rows}/></div>;

  const scale = balanceScale(points.map((p) => p.balance));
  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;
  const x = (i: number) => LEFT + 6 + (i * (plotW - 12)) / (points.length - 1);
  const y = (value: number) => TOP + (1 - (value - scale.low) / (scale.top - scale.low)) * plotH;
  const base = y(Math.max(scale.low, 0));
  // Degraus: o saldo fica igual até o dia em que algo muda.
  const path = points.map((p, i) => (i === 0 ? `M${x(0).toFixed(1)},${y(p.balance).toFixed(1)}` : `L${x(i).toFixed(1)},${y(points[i - 1].balance).toFixed(1)} L${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`)).join(' ');
  const last = points.length - 1;
  const mid = Math.round(last / 2);
  const aria = `${caption}: de ${money(points[0].balance)} hoje (${label(points[0].date)}) para ${money(points[last].balance)} em ${label(points[last].date)}`;
  return <div data-testid="chart-balance-forecast" className="enter max-w-[440px]">
    <svg role="img" aria-label={aria} viewBox={`0 0 ${W} ${H}`} className="block w-full">
      {scale.ticks.map((tick) => <g key={tick}>
        <line x1={LEFT} x2={W - RIGHT} y1={y(tick)} y2={y(tick)} strokeWidth={1} className="stroke-line"/>
        <text x={LEFT + 4} y={y(tick) - 5} fontSize={12} textAnchor="start" strokeWidth={3} paintOrder="stroke" className="fill-ink-soft stroke-paper">{tickLabel(tick)}</text>
      </g>)}
      {scale.low < 0 && scale.top > 0 && <line x1={LEFT} x2={W - RIGHT} y1={y(0)} y2={y(0)} strokeWidth={1.5} strokeDasharray="4 3" className="stroke-ink-soft"/>}
      <path d={`${path} L${x(last).toFixed(1)},${base.toFixed(1)} L${x(0).toFixed(1)},${base.toFixed(1)} Z`} className="fill-chart-in" fillOpacity={0.12}/>
      <path d={path} fill="none" strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" className="stroke-chart-in"/>
      <circle cx={x(0)} cy={y(points[0].balance)} r={6} strokeWidth={2} className="fill-chart-in stroke-paper"/>
      <circle cx={x(last)} cy={y(points[last].balance)} r={5} strokeWidth={2} className="fill-paper stroke-chart-in"/>
      <text x={x(0)} y={H - 8} fontSize={12} textAnchor="start" className="fill-ink font-semibold">hoje</text>
      <text x={x(mid)} y={H - 8} fontSize={12} textAnchor="middle" className="fill-ink-soft">{label(points[mid].date)}</text>
      <text x={x(last)} y={H - 8} fontSize={12} textAnchor="end" className="fill-ink-soft">{label(points[last].date)}</text>
    </svg>
    <ChartTable caption={caption} head={['Dia', 'Saldo']} rows={rows}/>
  </div>;
}
