import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Area, areaPath, capitalize, currentMonth, monthLabel, shiftMonth, type MonthKey } from '@/lib/format';

// The month selector of the three areas, above their tabs (shared-month RF-01, RF-06).
// The arrows stay inside the limits of the area that is open (RN-07).
export function MonthNav({ area, month, canGoPrevious = true, canGoNext = true }: {
  area: Area; month: MonthKey; canGoPrevious?: boolean; canGoNext?: boolean;
}) {
  const [, navigate] = useLocation();
  const arrow = 'grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';
  return <nav aria-label="Mês" className="enter mt-4 flex items-center justify-between gap-2 rounded-full border border-line bg-surface p-1.5">
    <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(areaPath(area, shiftMonth(month, -1)))} className={arrow}><ChevronLeft size={20}/></button>
    <div className="flex min-w-0 flex-col items-center text-center"><p data-testid="text-month" className="truncate font-display text-[20px] leading-tight text-ink">{capitalize(monthLabel(month))}</p>{month !== currentMonth() && <button data-testid="button-current-month" onClick={() => navigate(areaPath(area, currentMonth()))} className="text-[13px] font-semibold leading-snug text-brand underline decoration-brand/40 underline-offset-4">Voltar para o mês atual</button>}</div>
    <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(areaPath(area, shiftMonth(month, 1)))} className={arrow}><ChevronRight size={20}/></button>
  </nav>;
}
