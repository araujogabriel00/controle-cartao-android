import { Repeat } from 'lucide-react';
import { type IncomeScope } from '@workspace/api-client-react';
import { BottomSheet } from '@/components/bottom-sheet';
import { capitalize, monthLabel, type MonthKey } from '@/lib/format';

// Asked before editing or deleting one occurrence of a recurring item (incomes, bills and card purchases).
// Folha com dois botões grandes e a explicação de cada um (specs/redesign-opcao-d-telas-de-apoio.md D4).
export function ScopeDialog({ subject, action, month, onChoose, onClose }: {
  subject: string; action: 'edit' | 'delete'; month: MonthKey; onChoose: (scope: IncomeScope) => void; onClose: () => void;
}) {
  const verb = action === 'edit' ? 'Editar' : 'Excluir';
  const option = 'flex min-h-16 w-full flex-col justify-center rounded-2xl border border-line bg-paper px-4 py-3 text-left transition hover:bg-hover';
  return <BottomSheet title={`${verb} ${subject} que se repete`} onClose={onClose}>
    <p className="mb-3 flex items-center gap-2 text-[15px] text-ink-soft"><Repeat size={16} className="shrink-0"/>O que você quer {action === 'edit' ? 'mudar' : 'remover'}?</p>
    <div className="space-y-3">
      <button data-testid="button-scope-month" onClick={() => onChoose('month')} className={option}><span className="text-[16px] font-semibold text-ink">Só este mês</span><span className="text-[13px] text-ink-soft">Só em {capitalize(monthLabel(month))}; os outros meses não mudam.</span></button>
      <button data-testid="button-scope-forward" onClick={() => onChoose('forward')} className={option}><span className="text-[16px] font-semibold text-ink">Este e os próximos</span><span className="text-[13px] text-ink-soft">De {monthLabel(month)} em diante.</span></button>
    </div>
  </BottomSheet>;
}
