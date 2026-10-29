import { type KeyboardEvent } from 'react';
import { capitalize, money, monthLabel, monthName, type MonthKey } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const W = 358;
const H = 170;
const LEFT = 2;
const RIGHT = 2;
const TOP = 14;
const BOTTOM = 26;
const DOT = 4.5;
const DOT_LAST = 6;
const ROUND = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10];

export type BalanceLinePoint = { month: MonthKey; value: number };

// Menor valor "redondo" (1, 1,5, 2, 2,5, 3, 4, 5, 6, 7, 8 x 10^n) que não fica abaixo de `x`.
function niceUp(x: number) {
  if (!(x > 0)) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(x));
  return (ROUND.map((n) => n * magnitude).find((n) => n >= x - 1e-9)) ?? 10 * magnitude;
}

// Os rótulos do eixo ficam dentro da área do gráfico, acima de cada linha de grade, para as colunas de toque terem 48 px ou mais em 360 px.
// specs/redesign-v2-entradas.md RN-04: de 0 (ou do menor saldo, se for negativo) até um valor redondo acima do maior,
// com 3 marcas (início, meio e topo). Sem negativo o meio também é redondo ("0", "7 mil", "14 mil").
export function balanceScale(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const top = max > 0 ? 2 * niceUp(max / 2) : 0;
  const low = min < 0 ? -niceUp(-min) : 0;
  const span = top - low || 2;
  const high = top - low ? top : low + span;
  return { low, top: high, ticks: [low, (low + high) / 2, high] };
}

const trim = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
export const tickLabel = (value: number) => (value === 0 ? '0' : `${value < 0 ? '−' : ''}${Math.abs(value) >= 1000 ? `${trim(Math.abs(value) / 1000)} mil` : trim(Math.abs(value))}`);

// "Set" para setembro: o nome curto que o texto do mês escolhido e os rótulos usam.
export const shortMonth = (month: MonthKey) => capitalize(monthName(month).slice(0, 3));

// Gráfico "Saldo mês a mês" (specs/redesign-v2-entradas.md D2, D3): linha do saldo ao fim de cada mês, com grade, eixo e área
// a 12%. Cada mês é uma coluna tocável de 48 px ou mais; com o foco, as setas escolhem o mês. O último ponto leva o valor.
export function BalanceLine({ points, selected, onSelect }: { points: BalanceLinePoint[]; selected: MonthKey; onSelect: (month: MonthKey) => void }) {
  const caption = 'Saldo ao fim de cada mês';
  if (isHidden()) return <div data-testid="chart-balance-line" className="max-w-[440px]"><HiddenChart height={H}/><ChartTable caption={caption} head={['Mês', 'Saldo']} rows={points.map((p) => ({ label: capitalize(monthLabel(p.month)), value: money(p.value) }))}/></div>;

  const scale = balanceScale(points.map((p) => p.value));
  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;
  const colW = plotW / points.length;
  const x = (i: number) => LEFT + colW * (i + 0.5);
  const y = (value: number) => TOP + (1 - (value - scale.low) / (scale.top - scale.low)) * plotH;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const base = y(Math.max(scale.low, 0));
  const area = `${line} L${x(points.length - 1).toFixed(1)},${base.toFixed(1)} L${x(0).toFixed(1)},${base.toFixed(1)} Z`;
  const last = points.length - 1;
  const index = Math.max(0, points.findIndex((p) => p.month === selected));

  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    const next = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(points[Math.min(last, Math.max(0, next))].month);
  };

  const label = `${caption}: ${points.map((p) => `${shortMonth(p.month)} ${money(p.value)}`).join('; ')}`;
  const lastY = y(points[last].value);
  return <div data-testid="chart-balance-line" className="enter max-w-[440px]">
    <svg role="img" aria-label={label} tabIndex={0} onKeyDown={onKey} viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
      {scale.ticks.map((tick) => <g key={tick}>
        <line x1={LEFT} x2={W - RIGHT} y1={y(tick)} y2={y(tick)} strokeWidth={1} className="stroke-line"/>
        <text x={LEFT + 4} y={y(tick) - 5} fontSize={12} textAnchor="start" strokeWidth={3} paintOrder="stroke" className="fill-ink-soft stroke-paper">{tickLabel(tick)}</text>
      </g>)}
      {scale.low < 0 && scale.top > 0 && <line x1={LEFT} x2={W - RIGHT} y1={y(0)} y2={y(0)} strokeWidth={1.5} strokeDasharray="4 3" className="stroke-ink-soft"/>}
      {points.map((p, i) => p.month === selected && <rect key={`sel-${p.month}`} x={LEFT + colW * i} y={TOP - 6} width={colW} height={plotH + 6} rx={8} className="fill-tint" fillOpacity={0.6}/>)}
      <path d={area} className="fill-chart-in" fillOpacity={0.12}/>
      <path d={line} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-chart-in"/>
      {points.map((p, i) => {
        const big = i === last || p.month === selected;
        return <circle key={p.month} cx={x(i)} cy={y(p.value)} r={big ? DOT_LAST : DOT} strokeWidth={2} className="fill-chart-in stroke-paper"/>;
      })}
      <text x={x(last) - 9} y={Math.max(11, lastY - 11)} fontSize={12} fontWeight={600} textAnchor="end" className="fill-ink">{money(points[last].value)}</text>
      {points.map((p, i) => <text key={`m-${p.month}`} x={x(i)} y={H - 8} fontSize={12} textAnchor="middle" className={p.month === selected ? 'fill-ink font-semibold' : 'fill-ink-soft'}>{shortMonth(p.month)}</text>)}
      {points.map((p, i) => <rect key={`hit-${p.month}`} data-testid={`point-balance-${p.month}`} x={LEFT + colW * i} y={0} width={colW} height={H} fill="transparent" className="cursor-pointer" onClick={() => onSelect(p.month)}>
        <title>{`${capitalize(monthLabel(p.month))}: ${money(p.value)}`}</title>
      </rect>)}
    </svg>
    <ChartTable caption={caption} head={['Mês', 'Saldo']} rows={points.map((p) => ({ label: capitalize(monthLabel(p.month)), value: money(p.value) }))}/>
  </div>;
}
