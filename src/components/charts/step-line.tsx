import { dateLabel, money, monthName } from '@/lib/format';
import { niceScale, type PacePoint } from '@/lib/card-series';
import { isHidden } from '@/lib/hide-values';
import { ChartTable } from '@/components/charts/chart-table';

const W = 358;
const H = 220;
const LEFT = 44;
const RIGHT = 10;
const TOP = 22;
const BOTTOM = 26;

const axis = (value: number) => isHidden() ? '••' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);

// Gasto acumulado dia a dia, em degraus (specs/redesign-opcao-d-cartoes.md D5, D6). `light` desenha
// a linha em tom claro (mês futuro); `todayDay` marca "hoje" no mês corrente; `endDay` é até onde a linha vai.
export function StepLine({ month, days, points, todayDay, light, endDay }: {
  month: string; days: number; points: PacePoint[]; todayDay: number | null; light: boolean; endDay: number;
}) {
  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;
  const total = points.length ? points[points.length - 1].total : 0;
  const scale = niceScale(total);
  const x = (day: number) => LEFT + ((day - 1) / Math.max(1, days - 1)) * plotW;
  const y = (value: number) => TOP + plotH - (value / scale.top) * plotH;

  let path = `M${x(1)},${y(0)}`;
  for (const point of points) {
    path += ` H${x(point.day)} V${y(point.total)}`;
  }
  path += ` H${x(Math.max(endDay, points[points.length - 1]?.day ?? 1))}`;
  const area = `${path} V${y(0)} H${x(1)} Z`;
  const stroke = 'stroke-chart-violet';
  const opacity = light ? 0.38 : 1;

  const biggest = points.reduce<PacePoint | null>((top, point) => (!top || point.amount > top.amount ? point : top), null);
  const biggestIndex = biggest ? points.indexOf(biggest) : -1;
  const labelBase = biggestIndex > 0 ? points[biggestIndex - 1].total : 0;
  const nearEdge = biggest ? x(biggest.day) > W - 90 : false;

  const summary = points.map((point, index) => `${money(point.total)} no dia ${point.day}${index === points.length - 2 ? ' e ' : index < points.length - 2 ? ', ' : ''}`).join('');
  const ariaLabel = `${light ? 'Gasto previsto' : 'Gasto acumulado'} no cartão em ${monthName(month)}: ${summary}`;
  const ticksX = [1, 8, 15, 22, 29].filter((day) => day <= days);

  return <div className="max-w-[440px]">
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${H}`} className="block w-full">
      {scale.ticks.map((tick) => <g key={tick}>
        <line x1={LEFT} x2={W - RIGHT} y1={y(tick)} y2={y(tick)} strokeWidth={1} className="stroke-line"/>
        <text x={LEFT - 6} y={y(tick) + 4} fontSize={12} textAnchor="end" className="fill-ink-soft">{axis(tick)}</text>
      </g>)}
      <line x1={LEFT} x2={W - RIGHT} y1={y(0)} y2={y(0)} strokeWidth={1} className="stroke-ink-soft"/>
      <text x={LEFT - 6} y={y(0) + 4} fontSize={12} textAnchor="end" className="fill-ink-soft">0</text>
      {ticksX.map((day) => <text key={day} x={x(day)} y={H - 8} fontSize={12} textAnchor="middle" className="fill-ink-soft">{day}</text>)}
      {todayDay !== null && <g>
        <line x1={x(todayDay)} x2={x(todayDay)} y1={TOP} y2={y(0)} strokeWidth={1} strokeDasharray="3 3" className="stroke-ink-soft"/>
        <text x={x(todayDay)} y={TOP - 7} fontSize={12} textAnchor="middle" className="fill-ink-soft">hoje</text>
      </g>}
      {points.length > 0 && <>
        <path d={area} className="fill-chart-violet" fillOpacity={0.1 * (light ? 0.38 : 1)} stroke="none"/>
        <path d={path} fill="none" strokeWidth={2} strokeLinejoin="round" className={stroke} strokeOpacity={opacity}/>
      </>}
      {points.map((point, index) => <g key={index}>
        <circle cx={x(point.day)} cy={y(point.total)} r={4} strokeWidth={2} className="fill-chart-violet stroke-paper" fillOpacity={opacity}/>
        <circle cx={x(point.day)} cy={y(point.total)} r={14} fill="transparent"><title>{`${dateLabel(point.date)}: +${money(point.amount)} (${point.description})`}</title></circle>
      </g>)}
      {biggest && <text x={x(biggest.day) + (nearEdge ? -8 : 8)} y={(y(labelBase) + y(biggest.total)) / 2 + 4} fontSize={12} fontWeight={600} textAnchor={nearEdge ? 'end' : 'start'} className="fill-ink">{`+${money(biggest.amount)}`}</text>}
      {light && points.length > 0 && <text x={W - RIGHT} y={TOP - 7} fontSize={12} textAnchor="end" className="fill-ink-soft">prevista</text>}
    </svg>
    <ChartTable caption={`Gasto acumulado no cartão em ${monthName(month)}`} head={['Compra', 'Acumulado']}
      rows={points.map((point) => ({ label: `${dateLabel(point.date)} ${point.description}`, value: `+${money(point.amount)}; acumulado ${money(point.total)}` }))}/>
  </div>;
}
