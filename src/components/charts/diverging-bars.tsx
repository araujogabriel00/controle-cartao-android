import { money } from '@/lib/format';
import { ChartTable } from '@/components/charts/chart-table';

export type DivergingRow = { label: string; value: number; tone: 'in' | 'out' };

const WIDTH = 358;
const AXIS = WIDTH / 2;
const MAX_BAR = 100;
const BAR_H = 20;
const ROW_H = 52;
const GAP = 14; // espaço da linha que separa o Resultado do mês
const RADIUS = 4;
const MINUS = '−';

// Valor compacto, sem centavos: "+4.527", "−520", "0" (specs/redesign-opcao-d-entradas.md D4).
export const compact = (value: number, sign: '+' | '−') => {
  const rounded = Math.round(Math.abs(value));
  return rounded === 0 ? '0' : `${sign}${new Intl.NumberFormat('pt-BR').format(rounded)}`;
};

// Barra com a ponta do dado arredondada e o lado do eixo reto.
function barPath(side: 1 | -1, length: number, y: number) {
  const r = Math.min(RADIUS, length);
  const tip = AXIS + side * length;
  const edge = tip - side * r;
  const sweep = side === 1 ? 1 : 0;
  return `M${AXIS},${y} H${edge} A${r},${r} 0 0 ${sweep} ${tip},${y + r} V${y + BAR_H - r} A${r},${r} 0 0 ${sweep} ${edge},${y + BAR_H} H${AXIS} Z`;
}

// Barras divergentes: entrou à direita, saiu à esquerda, uma escala única para as cinco linhas (D3).
export function DivergingBars({ rows, result }: { rows: DivergingRow[]; result: { label: string; value: number } }) {
  const all = [...rows.map((row) => ({ ...row, signed: row.value, side: (row.tone === 'in' ? 1 : -1) as 1 | -1 })),
    { label: result.label, value: Math.abs(result.value), tone: result.value < 0 ? 'out' as const : 'in' as const, signed: result.value, side: (result.value < 0 ? -1 : 1) as 1 | -1 }];
  const max = Math.max(...all.map((row) => Math.abs(row.value)));
  const height = all.length * ROW_H + GAP;
  const exact = all.map((row) => ({ label: row.label, value: money(row.signed) }));
  const summary = exact.map((row, index) => `${index === 0 ? row.label : row.label.charAt(0).toLowerCase() + row.label.slice(1)} de ${row.value}`).join('; ');

  return <div className="max-w-[440px]">
    <svg role="img" aria-label={summary} viewBox={`0 0 ${WIDTH} ${height}`} className="block w-full" style={{ width: '100%' }}>
      {all.map((row, index) => {
        const top = index * ROW_H + (index === all.length - 1 ? GAP : 0);
        const y = top + 24;
        const length = max > 0 && row.value > 0 ? Math.max(2, (row.value / max) * MAX_BAR) : 0;
        const negativeResult = index === all.length - 1 && row.signed < 0;
        const sign = row.side === 1 ? '+' : MINUS;
        const textX = length > 0 ? AXIS + row.side * (length + 6) : AXIS + 6;
        return <g key={row.label}>
          {index === all.length - 1 && <line x1={0} x2={WIDTH} y1={top - GAP / 2} y2={top - GAP / 2} strokeWidth={1} className="stroke-line"/>}
          <text x={0} y={top + 16} fontSize={14} fontWeight={600} className="fill-ink">{row.label}</text>
          {length > 0 && <path d={barPath(row.side, length, y)} className={row.tone === 'in' ? 'fill-chart-in' : 'fill-chart-out'}><title>{`${row.label}: ${exact[index].value}`}</title></path>}
          <text x={textX} y={y + 15} fontSize={14} textAnchor={length > 0 && row.side === -1 ? 'end' : 'start'} className={negativeResult ? 'fill-alert' : 'fill-ink'}>{compact(row.value, sign)}</text>
        </g>;
      })}
      <line x1={AXIS} x2={AXIS} y1={0} y2={height} strokeWidth={1} className="stroke-ink-soft"/>
    </svg>
    <ChartTable caption="Entrou e saiu, por tipo, no mês" head={['Tipo', 'Valor']} rows={exact}/>
  </div>;
}
