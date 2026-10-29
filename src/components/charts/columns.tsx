import { capitalize, money, monthLabel, monthName } from '@/lib/format';
import { niceScale, type InvoiceColumn } from '@/lib/card-series';
import { isHidden } from '@/lib/hide-values';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const W = 358;
const H = 190;
const TOP = 22;
const BOTTOM = 26;
const BAR_W = 24;
const RADIUS = 4;

// Topo arredondado de 4 px e base reta.
const barPath = (x: number, y: number, height: number) => {
  const r = Math.min(RADIUS, height);
  return `M${x},${y + height} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} H${x + BAR_W - r} A${r},${r} 0 0 1 ${x + BAR_W},${y + r} V${y + height} Z`;
};

// Colunas por mês: cor cheia para o que já foi lançado, 38% para o previsto (specs/redesign-opcao-d-cartoes.md D8).
export function Columns({ columns, ariaLabel, caption }: { columns: InvoiceColumn[]; ariaLabel: string; caption: string }) {
  // Com o olho fechado o formato das colunas entregaria o que os valores escondem (specs/redesign-v2-cartoes.md RF-11).
  if (isHidden()) return <div className="max-w-[440px]"><HiddenChart height={H}/><ChartTable caption={caption} head={['Mês', 'Fatura']} rows={columns.map((col) => ({ label: capitalize(monthLabel(col.month)), value: `${money(col.amount)} (${col.planned ? 'prevista' : 'lançada'})` }))}/></div>;
  const plotH = H - TOP - BOTTOM;
  const base = H - BOTTOM;
  const scale = niceScale(Math.max(...columns.map((c) => c.amount)));
  const step = W / columns.length;
  const last = columns.length - 1;
  return <div className="max-w-[440px]">
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${H}`} className="block w-full">
      <line x1={0} x2={W} y1={base} y2={base} strokeWidth={1} className="stroke-line"/>
      {columns.map((col, i) => {
        const height = col.amount > 0 ? Math.max(2, (col.amount / scale.top) * plotH) : 2;
        const cx = step * i + step / 2;
        const x = cx - BAR_W / 2;
        const showValue = i === 0 || i === last;
        return <g key={col.month}>
          <path d={barPath(x, base - height, height)} className="fill-chart-violet" fillOpacity={col.planned ? 0.38 : 1}><title>{`${capitalize(monthLabel(col.month))}: ${money(col.amount)} (${col.planned ? 'prevista' : 'lançada'})`}</title></path>
          {showValue && <text x={i === 0 ? 0 : W} y={base - height - 6} fontSize={12} textAnchor={i === 0 ? 'start' : 'end'} className="fill-ink">{money(col.amount)}</text>}
          <text x={cx} y={H - 8} fontSize={12} textAnchor="middle" className="fill-ink-soft">{capitalize(monthName(col.month).slice(0, 3))}</text>
        </g>;
      })}
    </svg>
    <ChartTable caption={caption} head={['Mês', 'Fatura']} rows={columns.map((col) => ({ label: capitalize(monthLabel(col.month)), value: `${money(col.amount)} (${col.planned ? 'prevista' : 'lançada'})` }))}/>
  </div>;
}
