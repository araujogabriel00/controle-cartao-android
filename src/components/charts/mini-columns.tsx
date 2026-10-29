import { capitalize, money, monthLabel } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const H = 56;
const COL_W = 16;
const GAP = 6;
const RADIUS = 3;
const MIN_H = 2;

export type MiniColumn = { month: string; value: number };

// Topo arredondado de 3 px e base reta.
const columnPath = (x: number, y: number, height: number) => {
  const r = Math.min(RADIUS, height);
  return `M${x},${y + height} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} H${x + COL_W - r} A${r},${r} 0 0 1 ${x + COL_W},${y + r} V${y + height} Z`;
};

// Colunas das próximas faturas do painel Cartões (specs/inicio-com-minigraficos.md D4, RN-04, RN-05): a escala vai de
// zero ao maior valor; mês sem fatura vira um traço de 2 px, nunca some; a primeira coluna (mês aberto) é a mais forte.
export function MiniColumns({ columns, ariaLabel, caption, legend }: { columns: MiniColumn[]; ariaLabel: string; caption: string; legend: string }) {
  if (isHidden()) return <div data-testid="chart-home-invoices" className="w-[128px] shrink-0"><HiddenChart height={48}/><p className="mt-1 text-center text-[13px] text-ink-soft">{legend}</p></div>;
  const width = columns.length * COL_W + (columns.length - 1) * GAP;
  const max = Math.max(...columns.map((c) => c.value), 0);
  return <div data-testid="chart-home-invoices" className="enter w-[128px] shrink-0">
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${H}`} className="block h-auto w-full">
      {columns.map((col, i) => {
        const height = col.value > 0 && max > 0 ? Math.max(MIN_H, (col.value / max) * H) : MIN_H;
        return <path key={col.month} d={columnPath(i * (COL_W + GAP), H - height, height)} className="fill-chart-violet" fillOpacity={i === 0 ? 1 : 0.42}/>;
      })}
    </svg>
    <p className="mt-1 text-center text-[13px] text-ink-soft">{legend}</p>
    <ChartTable caption={caption} head={['Mês', 'Fatura']} rows={columns.map((col) => ({ label: capitalize(monthLabel(col.month)), value: money(col.value) }))}/>
  </div>;
}
