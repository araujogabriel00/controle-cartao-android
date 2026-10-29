import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { ChartTable, HiddenChart } from '@/components/charts/chart-table';
import { money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';

export type OriginRow = {
  id: string; label: string; icon: ReactNode; value: number; kind: 'in' | 'out';
  // "1 lançamento", "nenhuma neste mês"...; undefined quando a contagem não pôde ser lida (RN-07).
  count?: string;
  onOpen: () => void;
};

const NBSP = ' ';

// "+ R$ 4.527,00" / "− R$ 417,16" / "R$ 0,00": entradas levam "+", saídas "−" e o zero fica sem sinal (D6).
const signed = (value: number, kind: 'in' | 'out') => (value > 0 ? `${kind === 'in' ? '+' : '−'}${NBSP}${money(value)}` : money(value));

// RN-05: largura = min(100, valor ÷ total que entrou × 100); sem entrada, tudo zero; valor positivo tem no mínimo 4 px.
export const originPercent = (value: number, income: number) => (income > 0 ? Math.min(100, (value / income) * 100) : 0);

// As origens do mês como linhas de um cartão (specs/redesign-v2-entradas.md D4 a D6): ícone, nome, quantidade, valor com
// sinal, seta e uma barra que compara a origem com o total que entrou. Cada linha é um botão de 72 px ou mais.
export function OriginRows({ rows, income }: { rows: OriginRow[]; income: number }) {
  const hidden = isHidden();
  return <>
    <ul className="divide-y divide-line">
      {rows.map((row) => {
        const percent = originPercent(row.value, income);
        const name = `${row.label}${row.count ? `, ${row.count}` : ''}, ${signed(row.value, row.kind)}${hidden ? '' : `, ${Math.round(percent)}% do que entrou`}. Abrir a lista.`;
        return <li key={row.id}>
          <button data-testid={`row-origin-${row.id}`} aria-label={name} onClick={row.onOpen} className="block min-h-[72px] w-full px-4 py-3 text-left transition hover:bg-hover">
            <span className="flex items-center gap-3">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand">{row.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold text-ink">{row.label}</span>
                {row.count && <span className="block truncate text-[14px] text-ink-soft">{row.count}</span>}
              </span>
              <span className="shrink-0 font-mono-data text-[16px] text-ink">{signed(row.value, row.kind)}</span>
              <ChevronRight aria-hidden size={20} className="shrink-0 text-ink-soft"/>
            </span>
            <span aria-hidden className="mt-2 block">
              {hidden
                ? <HiddenChart height={8}/>
                : <span className="block h-2 overflow-hidden rounded-full bg-chart-track"><span className={`block h-full rounded-full ${row.kind === 'in' ? 'bg-chart-in' : 'bg-chart-out'}`} style={{ width: row.value > 0 ? `max(4px, ${percent}%)` : 0 }}/></span>}
            </span>
          </button>
        </li>;
      })}
    </ul>
    <ChartTable caption="Entrou e saiu no mês" head={['Origem', 'Valor']} rows={rows.map((row) => ({ label: `${row.label}${row.count ? ` (${row.count})` : ''}`, value: `${signed(row.value, row.kind)}${hidden ? '' : ` — ${Math.round(originPercent(row.value, income))}% do que entrou`}` }))}/>
  </>;
}
