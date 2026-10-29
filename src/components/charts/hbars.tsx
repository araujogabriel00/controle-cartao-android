import type { ReactNode } from 'react';
import { money } from '@/lib/format';
import type { CategoryRow } from '@/lib/card-series';

// `detail` é uma linha de apoio de 13 px; `tag` é um selo ao lado do nome; `noBar` esconde barra e percentual
// (categoria fechada em Benefícios); `alert` pinta o valor na cor de alerta.
export type HBarRow = CategoryRow & { detail?: ReactNode; tag?: string; noBar?: boolean; alert?: boolean };

// Barras horizontais, uma por linha: nome, "valor · percentual" e barra de 12 px sobre o trilho.
// Cada linha é um botão (texto legível por leitor de tela); a barra é só decoração. `fill` é uma
// classe de cor de fundo, igual para todas as linhas (ex.: "bg-chart-violet"). `renderAfter` põe algo
// (ex.: uma ação) abaixo da linha, fora do botão.
export function HBars({ rows, fill, label, activeKey, onSelect, testId, rowTestId, openTestId, openLabel, renderAfter }: {
  rows: HBarRow[]; fill: string; label: string; activeKey?: string; onSelect?: (key: string) => void; testId?: string;
  rowTestId?: (key: string) => string; openTestId?: (key: string) => string; openLabel?: (row: HBarRow) => string; renderAfter?: (row: HBarRow) => ReactNode;
}) {
  return <ul aria-label={label} data-testid={testId} className="divide-y divide-line border-y border-line">
    {rows.map((row) => {
      const percent = Number(row.percent).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
      const body = <>
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2"><span className="truncate text-[14px] font-semibold text-ink">{row.label}</span>{row.tag && <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[12px] font-medium text-ink-soft">{row.tag}</span>}</span>
          <span className={`shrink-0 font-mono-data text-[14px] ${row.alert ? 'text-alert' : 'text-ink'}`}>{row.noBar ? money(row.amount) : `${money(row.amount)} · ${percent}%`}</span>
        </span>
        {!row.noBar && <span aria-hidden className="mt-1.5 block h-3 overflow-hidden rounded-[4px] bg-chart-track"><span className={`block h-full rounded-r-[4px] ${fill}`} style={{ width: `${Math.max(0, Math.min(row.percent, 100))}%` }}/></span>}
        {row.detail && <span className="mt-1 block text-[13px] text-ink-soft">{row.detail}</span>}
      </>;
      return <li key={row.key} data-testid={rowTestId?.(row.key)}>
        {onSelect && !row.other
          ? <button type="button" data-testid={openTestId?.(row.key)} aria-label={openLabel?.(row)} aria-pressed={activeKey === undefined ? undefined : activeKey === row.key} onClick={() => onSelect(row.key)} className={`block min-h-11 w-full py-2.5 text-left transition hover:bg-surface ${activeKey === row.key ? 'bg-surface' : ''}`}>{body}</button>
          : <div className="min-h-11 py-2.5">{body}</div>}
        {renderAfter?.(row)}
      </li>;
    })}
  </ul>;
}
