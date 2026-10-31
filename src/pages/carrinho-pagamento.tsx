import { Redirect, useLocation } from 'wouter';
import { useGetCart, useGetCartCoverage, useGetCartPaymentPreview, type CartFormInput } from '@workspace/api-client-react';
import { CircleHelp, Split } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { BalanceEffect, FORM_ICON, FormEffect, InstallmentChips } from '@/components/cart-parts';
import { setCartDraft, useCartDraft } from '@/lib/cart-draft';
import { currentMonth, money, monthName } from '@/lib/format';

const option = 'block w-full rounded-2xl border bg-surface px-4 py-3 text-left transition';

// specs/carrinho.md RF-04, RF-05, D4 a D7: "Como vai pagar?" com uma forma só, ou "Dividir em mais de uma forma".
export default function CarrinhoPagamento() {
  const [, navigate] = useLocation();
  const draft = useCartDraft();
  const cart = useGetCart();
  const coverage = useGetCartCoverage();
  const selected = draft.mode === 'single' ? draft.forms[0] : undefined;
  const preview = useGetCartPaymentPreview({ forms: selected ? [selected] : [] }, { query: { enabled: Boolean(selected) } });

  if (cart.data && cart.data.items.length === 0) return <Redirect to="/carrinho" replace />;
  const total = cart.data?.total ?? 0;
  const info = coverage.data;
  const choose = (form: Omit<CartFormInput, 'amount'>) => setCartDraft({ mode: 'single', warning: null, forms: [{ ...form, amount: total }] });
  const balanceAfter = info ? Math.round((info.balanceToday - total) * 100) / 100 : 0;
  const month = currentMonth();

  return <main className="notebook-grain min-h-safe bg-paper pb-40 text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <BackButton onClick={() => navigate('/carrinho')}/>
      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <h1 className="font-display text-[28px] leading-tight text-ink">Como vai pagar?</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Total <span data-testid="text-pay-total" className="font-mono-data text-ink">{money(total)}</span></p>
      </section>

      {cart.isError || coverage.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir as formas de pagamento.</h2><button type="button" onClick={() => { void cart.refetch(); void coverage.refetch(); }} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button></div>
        : !info ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[72px] animate-pulse rounded-2xl bg-line"/><div className="h-[72px] animate-pulse rounded-2xl bg-line"/></div>
        : <div role="radiogroup" aria-label="Forma de pagamento" className="enter mt-5 space-y-3" style={{ animationDelay: '.1s' }}>
          <div>
            <button type="button" role="radio" aria-checked={selected?.kind === 'balance'} data-testid="option-pay-balance" onClick={() => choose({ kind: 'balance' })} className={`${option} ${selected?.kind === 'balance' ? 'border-brand' : 'border-line hover:bg-hover'}`}>
              <span className="flex items-center gap-3"><span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><FORM_ICON.balance size={20}/></span>
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold text-ink">Saldo da conta</span><span className="block text-[14px] text-ink-soft">Vira gasto do dia a dia · fica {money(balanceAfter)} depois</span>
                  {balanceAfter < 0 && <span data-testid="text-balance-warning" className="block text-[14px] font-semibold text-alert">Deixa o saldo negativo</span>}</span>
              </span>
            </button>
          </div>

          {info.cards.map((card) => {
            const on = selected?.kind === 'card' && selected.id === card.id;
            const form = preview.data?.forms[0];
            return <div key={card.id}>
              <button type="button" role="radio" aria-checked={on} data-testid={`option-pay-card-${card.id}`} onClick={() => choose({ kind: 'card', id: card.id, installments: 1 })} className={`${option} ${on ? 'border-brand' : 'border-line hover:bg-hover'}`}>
                <span className="flex items-center gap-3"><span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><FORM_ICON.card size={20}/></span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold text-ink">Cartão {card.name}</span><span className="block text-[14px] text-ink-soft">Fatura de {monthName(month)} em {money(card.invoice)}</span></span>
                </span>
              </button>
              {on && selected && <div className="px-1 pb-1">
                <InstallmentChips value={selected.installments ?? 1} total={total} onChange={(installments) => choose({ kind: 'card', id: card.id, installments })}/>
                {form && <div data-testid="text-pay-effect" className="mt-2"><FormEffect form={form} month={month}/></div>}
              </div>}
            </div>;
          })}

          {info.benefits.map((benefit) => {
            const on = selected?.kind === 'benefit' && selected.id === benefit.id;
            const form = preview.data?.forms[0];
            return <div key={benefit.id}>
              <button type="button" role="radio" aria-checked={on} aria-disabled={!benefit.canPayAlone} disabled={!benefit.canPayAlone} data-testid={`option-pay-benefit-${benefit.id}`} onClick={() => choose({ kind: 'benefit', id: benefit.id })}
                className={`${option} ${on ? 'border-brand' : 'border-line'} ${benefit.canPayAlone ? 'hover:bg-hover' : 'opacity-55'}`}>
                <span className="flex items-center gap-3"><span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><FORM_ICON.benefit size={20}/></span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold text-ink">{benefit.name}</span>
                    <span className="block text-[14px] text-ink-soft">{benefit.canPayAlone ? `Cobre os ${money(benefit.coverage)} do carrinho` : `Cobre ${money(benefit.coverage)} de ${money(total)} · só em Dividir`}</span></span>
                </span>
              </button>
              {on && form && <div className="px-1 pt-2"><FormEffect form={form} month={month}/></div>}
            </div>;
          })}

          <button type="button" data-testid="button-split-payment" onClick={() => { setCartDraft({ mode: 'split', forms: [], warning: null }); navigate('/carrinho/dividir'); }} className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line px-4 py-3 text-left text-[16px] font-semibold text-brand transition hover:bg-hover"><Split aria-hidden size={20}/>Dividir em mais de uma forma</button>
        </div>}

      {selected && preview.data && <div className="mt-4"><BalanceEffect testId="text-pay-balance" preview={preview.data}/></div>}
      {preview.data && !preview.data.valid && selected && <p role="alert" data-testid="text-pay-issue" className="mt-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{preview.data.issues.join(' ')}</p>}
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <button type="button" data-testid="button-continue-single" disabled={!selected || !preview.data?.valid} onClick={() => navigate('/carrinho/confirmar')} className="mx-auto block h-14 w-full max-w-[440px] rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-50">Continuar</button>
    </div>
  </main>;
}

