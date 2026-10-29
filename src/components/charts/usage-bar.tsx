import { useId } from 'react';
import { money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';

const W = 150;
const H = 16;
const GAP = 2;
const RADIUS = 4;

// Barra única do painel Benefícios (specs/inicio-com-minigraficos.md D5, D10): o gasto em `chart-rose` e o restante em
// `chart-rose-tint`, 2 px entre as partes. Se o gasto passa do total, fica toda em `chart-rose`.
export function UsageBar({ spent, total }: { spent: number; total: number }) {
  const clip = useId();
  if (isHidden()) return <div data-testid="chart-home-benefits" className="w-[128px] shrink-0"><HiddenChart height={16}/></div>;
  const over = spent > total;
  const available = total - spent;
  const spentW = over || total <= 0 ? (spent > 0 ? W : 0) : (spent / total) * W;
  const split = spentW > 0 && spentW < W;
  return <div data-testid="chart-home-benefits" className="enter w-[128px] shrink-0">
    <svg role="img" aria-label={`Gasto ${money(spent)} de ${money(total)}; ${over ? `passou ${money(-available)} do disponível` : `disponível ${money(available)}`}`} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
      <defs><clipPath id={clip}><rect x={0} y={0} width={W} height={H} rx={RADIUS}/></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={W} height={H} className="fill-chart-rose-tint"/>
        {spentW > 0 && <rect x={0} y={0} width={split ? Math.max(0, spentW - GAP / 2) : W} height={H} className="fill-chart-rose"/>}
        {split && <rect x={spentW + GAP / 2} y={0} width={W - spentW - GAP / 2} height={H} className="fill-chart-rose-tint"/>}
      </g>
    </svg>
    <ChartTable caption="Uso dos benefícios no mês" head={['Item', 'Valor']} rows={[{ label: 'Disponível no mês', value: money(total) }, { label: 'Gasto', value: money(spent) }, { label: over ? 'Passou do disponível' : 'Ainda disponível', value: money(over ? -available : available) }]}/>
  </div>;
}
