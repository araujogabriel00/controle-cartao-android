import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Area, areaPath, capitalize, currentMonth, monthLabel, monthName, shiftMonth, type MonthKey } from '@/lib/format';

// The month selector of the areas, in the middle of the header (shared-month RF-01, RF-06).
// The arrows stay inside the limits of the area that is open (RN-07).
export function MonthNav({ area, month, canGoPrevious = true, canGoNext = true }: {
  area: Area; month: MonthKey; canGoPrevious?: boolean; canGoNext?: boolean;
}) {
  const [, navigate] = useLocation();
  const arrow = 'grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';
  return <nav aria-label="Mês" className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-full border border-line bg-surface p-1">
    <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(areaPath(area, shiftMonth(month, -1)))} className={arrow}><ChevronLeft size={20}/></button>
    <div className="flex min-w-0 flex-col items-center text-center">{/* Abaixo de 420 px não cabe "Setembro de 2026" entre as setas: entra a forma curta ("Set 2026"). */}
      <p data-testid="text-month" className="max-w-full truncate font-display text-[18px] leading-tight text-ink min-[420px]:text-[20px]"><span className="min-[420px]:hidden">{capitalize(monthName(month).slice(0, 3))} {month.slice(0, 4)}</span><span className="hidden min-[420px]:inline">{capitalize(monthLabel(month))}</span></p>{month !== currentMonth() && <button data-testid="button-current-month" onClick={() => navigate(areaPath(area, currentMonth()))} aria-label="Voltar para o mês atual" className="text-[13px] font-semibold leading-snug text-brand underline decoration-brand/40 underline-offset-4"><span className="min-[420px]:hidden">Mês atual</span><span className="hidden min-[420px]:inline">Voltar para o mês atual</span></button>}</div>
    <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(areaPath(area, shiftMonth(month, 1)))} className={arrow}><ChevronRight size={20}/></button>
  </nav>;
}
