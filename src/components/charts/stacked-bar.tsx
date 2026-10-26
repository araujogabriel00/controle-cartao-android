import { useId } from 'react';
import { money } from '@/lib/format';
import { ChartTable } from '@/components/charts/chart-table';

const W = 358;
const H = 16;
const GAP = 2;
const RADIUS = 4;

// Barra única empilhada: "Gasto" em `chart-rose` e "Disponível" em `chart-rose-tint`, 2 px entre os dois e
// extremos arredondados de 4 px (specs/redesign-opcao-d-beneficios.md D4). Se o gasto passa do total, fica toda em `chart-rose`.
export function StackedBar({ spent, total }: { spent: number; total: number }) {
  const clip = useId();
  const over = spent > total;
  const available = total - spent;
  const spentW = over || total <= 0 ? (spent > 0 ? W : 0) : (spent / total) * W;
  const split = spentW > 0 && spentW < W;
  return <div className="max-w-[440px]">
    <svg role="img" aria-label={`Gasto ${money(spent)} de ${money(total)}; ${over ? `passou ${money(-available)} do crédito` : `disponível ${money(available)}`}`} viewBox={`0 0 ${W} ${H}`} className="block w-full">
      <defs><clipPath id={clip}><rect x={0} y={0} width={W} height={H} rx={RADIUS}/></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={W} height={H} className="fill-chart-rose-tint"/>
        {spentW > 0 && <rect x={0} y={0} width={split ? Math.max(0, spentW - GAP / 2) : W} height={H} className="fill-chart-rose"><title>{`Gasto: ${money(spent)}`}</title></rect>}
        {split && <rect x={spentW + GAP / 2} y={0} width={W - spentW - GAP / 2} height={H} className="fill-chart-rose-tint"><title>{`Disponível: ${money(available)}`}</title></rect>}
      </g>
    </svg>
    <ChartTable caption="Uso do crédito no mês" head={['Item', 'Valor']} rows={[{ label: 'Crédito', value: money(total) }, { label: 'Gasto', value: money(spent) }, { label: over ? 'Passou do crédito' : 'Disponível', value: money(over ? -available : available) }]}/>
  </div>;
}
