import { CreditCard, type LucideIcon, Utensils, Wallet } from 'lucide-react';
import type { CartFormPreview, CartPaymentPreview } from '@workspace/api-client-react';
import { money, monthName } from '@/lib/format';

// Peças comuns das telas do Carrinho (specs/carrinho.md).
export const FORM_ICON: Record<'balance' | 'card' | 'benefit', LucideIcon> = { balance: Wallet, card: CreditCard, benefit: Utensils };

export const INSTALLMENT_CHOICES = [1, 2, 3, 6, 12] as const;

// D5 / RN-11: parcelas que deixariam a parcela abaixo de R$ 0,01 ficam desativadas.
export function InstallmentChips({ value, total, onChange }: { value: number; total: number; onChange: (installments: number) => void }) {
  return <div role="group" aria-label="Parcelas" className="mt-3 flex flex-wrap gap-2">
    {INSTALLMENT_CHOICES.map((n) => {
      const disabled = Math.round(total * 100) < n;
      return <button key={n} type="button" data-testid={`chip-installments-${n}`} aria-pressed={value === n} disabled={disabled} onClick={() => onChange(n)}
        className={`h-12 min-w-12 flex-1 rounded-full border px-2 text-[15px] font-semibold transition disabled:opacity-50 ${value === n ? 'border-brand bg-brand text-on-brand' : 'border-line text-ink hover:bg-hover'}`}>{n}x</button>;
    })}
  </div>;
}

// "Saldo: não muda" / "Saldo: fica R$ X depois" / "Deixa o saldo negativo" (D12): o aviso é texto, não só cor.
export function BalanceEffect({ preview, testId }: { preview: Pick<CartPaymentPreview, 'balanceBefore' | 'balanceAfter'>; testId?: string }) {
  if (preview.balanceAfter === null) return null;
  const same = Math.round(preview.balanceAfter * 100) === Math.round(preview.balanceBefore * 100);
  const negative = preview.balanceAfter < 0;
  return <p data-testid={testId} className={`text-[14px] leading-5 ${negative ? 'font-semibold text-alert' : 'text-ink-soft'}`}>
    {same ? 'Saldo: não muda' : `Saldo: fica ${money(preview.balanceAfter)} depois`}{negative && ' · Deixa o saldo negativo'}
  </p>;
}

// O que uma forma muda: o disponível do benefício, a fatura do cartão e as parcelas.
export function FormEffect({ form, month }: { form: CartFormPreview; month: string }) {
  if (form.kind === 'benefit') return form.availableAfter === null ? null : <p className="text-[14px] leading-5 text-ink-soft">Disponível fica {money(form.availableAfter)}</p>;
  if (form.kind === 'card') {
    return <>
      {form.installments > 1 && form.perInstallment !== null && <p className="text-[14px] leading-5 text-ink-soft">{form.installments}x de {money(form.perInstallment)}</p>}
      {form.invoiceAfter !== null && form.invoiceBefore !== null && <p className="text-[14px] leading-5 text-ink-soft">Fatura de {monthName(month)} passa de {money(form.invoiceBefore)} para {money(form.invoiceAfter)}</p>}
    </>;
  }
  return null;
}
