import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Area, areaPath, capitalize, currentMonth, monthLabel, shiftMonth, type MonthKey } from '@/lib/format';

// The month selector of the three areas, above their tabs (shared-month RF-01, RF-06).
// The arrows stay inside the limits of the area that is open (RN-07).
export function MonthNav({ area, month, canGoPrevious = true, canGoNext = true }: {
  area: Area; month: MonthKey; canGoPrevious?: boolean; canGoNext?: boolean;
}) {
  const [, navigate] = useLocation();
  const arrow = 'grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#546b5d] transition hover:bg-[#ece7dc] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';
  return <nav aria-label="Mês" className="enter mt-4 flex items-center justify-between gap-2 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1.5">
    <button data-testid="button-previous-month" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => navigate(areaPath(area, shiftMonth(month, -1)))} className={arrow}><ChevronLeft size={17}/></button>
    <div className="min-w-0 text-center"><p data-testid="text-month" className="truncate font-display text-[17px] text-[#234638]">{capitalize(monthLabel(month))}</p>{month !== currentMonth() && <button data-testid="button-current-month" onClick={() => navigate(areaPath(area, currentMonth()))} className="text-[10px] font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Voltar para o mês atual</button>}</div>
    <button data-testid="button-next-month" aria-label="Próximo mês" disabled={!canGoNext} onClick={() => navigate(areaPath(area, shiftMonth(month, 1)))} className={arrow}><ChevronRight size={17}/></button>
  </nav>;
}
