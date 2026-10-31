import { type FormEvent, useState } from 'react';
import { FormSheet, SheetHeader } from '@/components/bottom-sheet';
import { DreamIconView } from '@/components/dream-parts';
import { dialogPanel } from '@/lib/dialog-styles';
import { money } from '@/lib/format';
import type { DreamItem } from '@workspace/api-client-react';

const SHORTCUTS = [50, 100, 200, 500];

const round = (value: number) => Math.round(value * 100) / 100;

// "Guardar agora" (RF-06) e "Retirar" (RF-08): a folha com a caixinha, o valor e o aviso do que acontece com o saldo.
// Guardar traz atalhos de +50 a +500 e o valor do plano como sugestão; retirar traz só "Tudo".
export function MoneySheet({ kind, dream, balance, busy, error, onClose, onSave }: {
  kind: 'deposit' | 'withdraw'; dream: DreamItem; balance: number; busy: boolean; error?: string | null;
  onClose: () => void; onSave: (amount: number) => void;
}) {
  const deposit = kind === 'deposit';
  const [text, setText] = useState(() => (deposit && dream.pace && dream.pace <= balance ? String(round(dream.pace)) : ''));
  const amount = Number(text.replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0;
  const add = (extra: number) => setText(String(round((valid ? amount : 0) + extra)));
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(round(amount)); };
  const action = deposit ? 'Guardar' : 'Retirar';
  return <FormSheet onClose={onClose}>
    <form data-testid="sheet-save-money" onSubmit={submit} className={dialogPanel}>
      <SheetHeader kicker={dream.name} title={deposit ? 'Guardar agora' : 'Retirar da caixinha'} onClose={onClose}/>
      <p className="mb-4 flex items-center gap-3 rounded-2xl bg-tint px-4 py-3 text-[15px] text-ink">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-brand"><DreamIconView icon={dream.icon}/></span>
        <span className="min-w-0"><span className="block truncate font-semibold">{dream.name}</span><span className="block text-[14px] text-ink-soft">Guardado {money(dream.saved)} de {money(dream.goal)}</span></span>
      </p>
      <label htmlFor="input-save-amount" className="field-label">Valor</label>
      <div className="relative mb-3"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span>
        <input id="input-save-amount" data-testid="input-save-amount" required type="number" min="0.01" step="0.01" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="0,00" className="field-input pl-12"/>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {deposit
          ? SHORTCUTS.map((value) => <button key={value} type="button" data-testid={`button-save-plus-${value}`} onClick={() => add(value)} className="h-12 min-w-14 flex-1 rounded-full border border-line px-3 text-[15px] font-semibold text-ink transition hover:bg-hover">+{value}</button>)
          : <button type="button" data-testid="button-withdraw-all" onClick={() => setText(String(round(dream.saved)))} className="h-12 rounded-full border border-line px-5 text-[15px] font-semibold text-ink transition hover:bg-hover">Tudo</button>}
      </div>
      <p data-testid="text-save-help" className="mb-4 text-[14px] leading-5 text-ink-soft">
        {deposit ? `Sai do saldo e vai para a caixinha. Saldo depois: ${money(round(balance - (valid ? amount : 0)))}` : `Volta para o saldo. Saldo depois: ${money(round(balance + (valid ? amount : 0)))}`}
      </p>
      {error && <p role="alert" data-testid="text-form-error" className="mb-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
      <button data-testid="button-save-confirm" disabled={busy || !valid} type="submit" className="h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">
        {busy ? 'Salvando…' : `${action}${valid ? ` ${money(amount)}` : ''}`}
      </button>
    </form>
  </FormSheet>;
}
