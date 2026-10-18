import { Repeat } from 'lucide-react';
import { type IncomeScope } from '@workspace/api-client-react';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { capitalize, monthLabel, type MonthKey } from '@/lib/format';

// Asked before editing or deleting one occurrence of a recurring item (incomes, bills and card purchases).
export function ScopeDialog({ subject, action, month, onChoose, onClose }: {
  subject: string; action: 'edit' | 'delete'; month: MonthKey; onChoose: (scope: IncomeScope) => void; onClose: () => void;
}) {
  const verb = action === 'edit' ? 'Editar' : 'Excluir';
  return <div className={dialogOverlay}>
    <div className="h-full overflow-y-auto overscroll-contain"><div className="flex min-h-full p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="scope-title" className={dialogPanel}>
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ece2] text-[#52735c]"><Repeat size={22}/></div>
        <h2 id="scope-title" className="font-display text-[26px] leading-tight text-[#234638]">{verb} {subject} que se repete</h2>
        <p className="mt-2 text-sm leading-6 text-[#6e7a6f]">O que você quer {action === 'edit' ? 'mudar' : 'remover'}?</p>
        <div className="mt-6 space-y-3">
          <button data-testid="button-scope-month" onClick={() => onChoose('month')} className="w-full rounded-2xl border border-[#e1dbce] bg-[#fffdf7] px-4 py-3 text-left transition hover:bg-[#f4f0e6]"><span className="block text-sm font-semibold text-[#315944]">Só este mês</span><span className="text-[11px] text-[#7c877a]">{capitalize(monthLabel(month))}</span></button>
          <button data-testid="button-scope-forward" onClick={() => onChoose('forward')} className="w-full rounded-2xl border border-[#e1dbce] bg-[#fffdf7] px-4 py-3 text-left transition hover:bg-[#f4f0e6]"><span className="block text-sm font-semibold text-[#315944]">Este e os próximos</span><span className="text-[11px] text-[#7c877a]">De {monthLabel(month)} em diante</span></button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Cancelar</button>
      </div>
    </div></div>
  </div>;
}
