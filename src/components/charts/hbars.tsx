import { money } from '@/lib/format';
import type { CategoryRow } from '@/lib/card-series';

// Barras horizontais, uma por linha: nome, "valor · percentual" e barra de 12 px sobre o trilho.
// Cada linha é um botão (texto legível por leitor de tela); a barra é só decoração. `fill` é uma
// classe de cor de fundo, igual para todas as linhas (ex.: "bg-chart-violet").
export function HBars({ rows, fill, label, activeKey, onSelect, testId, rowTestId }: {
  rows: CategoryRow[]; fill: string; label: string; activeKey?: string; onSelect?: (key: string) => void; testId?: string; rowTestId?: (key: string) => string;
}) {
  return <ul aria-label={label} data-testid={testId} className="divide-y divide-line border-y border-line">
    {rows.map((row) => {
      const percent = Number(row.percent).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
      const body = <>
        <span className="flex items-baseline justify-between gap-3"><span className="truncate text-[14px] font-semibold text-ink">{row.label}</span><span className="shrink-0 font-mono-data text-[14px] text-ink">{money(row.amount)} · {percent}%</span></span>
        <span aria-hidden className="mt-1.5 block h-3 overflow-hidden rounded-[4px] bg-chart-track"><span className={`block h-full rounded-r-[4px] ${fill}`} style={{ width: `${Math.max(0, Math.min(row.percent, 100))}%` }}/></span>
      </>;
      return <li key={row.key} data-testid={rowTestId?.(row.key)}>
        {onSelect && !row.other
          ? <button type="button" aria-pressed={activeKey === row.key} onClick={() => onSelect(row.key)} className={`block min-h-11 w-full py-2.5 text-left transition hover:bg-surface ${activeKey === row.key ? 'bg-surface' : ''}`}>{body}</button>
          : <div className="min-h-11 py-2.5">{body}</div>}
      </li>;
    })}
  </ul>;
}
