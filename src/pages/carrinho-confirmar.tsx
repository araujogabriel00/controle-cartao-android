import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocation } from 'wouter';
import { CartDraftError, useCheckoutCart, useGetCart, useGetCartPaymentPreview } from '@workspace/api-client-react';
import { CircleHelp } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { BalanceEffect, FORM_ICON, FormEffect } from '@/components/cart-parts';
import { setCartDraft, useCartDraft } from '@/lib/cart-draft';
import { money } from '@/lib/format';

// specs/carrinho.md RF-07, D10, RN-09, RN-10: o resumo, "O que vai mudar" por forma e a confirmação.
export default function CarrinhoConfirmar() {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const draft = useCartDraft();
  const cart = useGetCart();
  const [error, setError] = useState<string | null>(null);
  const preview = useGetCartPaymentPreview({ forms: draft.forms }, { query: { enabled: draft.forms.length > 0 } });
  const back = draft.mode === 'split' ? '/carrinho/dividir' : '/carrinho/pagamento';
  const checkout = useCheckoutCart({
    mutation: {
      // Navega antes de atualizar as leituras: o carrinho esvaziado não pode mandar esta tela de volta para /carrinho.
      onSuccess: (result) => { setCartDraft({ result, warning: null }); navigate('/carrinho/ok'); void client.invalidateQueries(); },
      onError: (e) => {
        // RN-10: se a divisão deixou de valer, volta para "Dividir" com o motivo; qualquer outro erro fica aqui e nada foi criado.
        if (e instanceof CartDraftError || e.name === 'CartDraftError') { setCartDraft({ mode: 'split', warning: e.message }); navigate('/carrinho/dividir'); } else setError(e.message);
      },
    },
  });

  // RN-03: sem rascunho (recarregou o app) ou sem produtos, volta para o carrinho.
  if (draft.forms.length === 0 || (cart.data && cart.data.items.length === 0)) return <Redirect to="/carrinho" replace />;
  const items = cart.data?.items ?? [];

  return <main className="notebook-grain min-h-safe bg-paper pb-44 text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <BackButton onClick={() => navigate(back)}/>
      <h1 className="enter mt-3 font-display text-[28px] leading-tight text-ink">Confirmar compra</h1>

      <section aria-label="Resumo" className="enter mt-5 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: '.08s' }}>
        <ul data-testid="list-confirm-items" className="divide-y divide-line">
          {items.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 py-2 text-[15px]">
            <span className="min-w-0 text-ink [overflow-wrap:anywhere]">{item.quantity}× {item.name}</span>
            <span className="shrink-0 font-mono-data text-ink">{money(item.total)}</span>
          </li>)}
        </ul>
        <p className="mt-2 flex items-center justify-between border-t border-line pt-3 text-[16px] font-semibold text-ink"><span>Total</span><span data-testid="text-confirm-total" className="font-mono-data">{money(cart.data?.total ?? 0)}</span></p>
      </section>

      <section aria-label="O que vai mudar" className="enter mt-5" style={{ animationDelay: '.12s' }}>
        <h2 className="font-display text-[20px] text-ink">O que vai mudar</h2>
        {preview.isError ? <div className="mt-2 rounded-2xl border border-line bg-surface px-5 py-7 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><button type="button" onClick={() => void preview.refetch()} className="mt-2 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button></div>
          : !preview.data ? <div aria-busy="true" className="mt-2 h-[120px] animate-pulse rounded-2xl bg-line"/>
          : <ul data-testid="list-confirm-changes" className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {preview.data.forms.map((form) => {
              const Icon = FORM_ICON[form.kind];
              return <li key={form.key} data-testid={`change-${form.key.replace(':', '-')}`} className="flex gap-3 px-4 py-3">
                <span aria-hidden className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Icon size={20}/></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-[16px] font-semibold text-ink"><span className="min-w-0 [overflow-wrap:anywhere]">{form.name}</span><span className="shrink-0 font-mono-data">{money(form.amount)}</span></span>
                  <FormEffect form={form} month={preview.data.month}/>
                  {form.kind === 'balance' && <BalanceEffect preview={preview.data}/>}
                </span>
              </li>;
            })}
            {!preview.data.forms.some((f) => f.kind === 'balance') && <li className="px-4 py-3"><BalanceEffect testId="text-confirm-balance" preview={preview.data}/></li>}
          </ul>}
        {preview.data && !preview.data.valid && <p role="alert" data-testid="text-confirm-issue" className="mt-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{preview.data.issues.join(' ')}</p>}
        {error && <p role="alert" data-testid="text-form-error" className="mt-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
      </section>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <div className="mx-auto max-w-[440px] space-y-2">
        <button type="button" data-testid="button-confirm-purchase" disabled={checkout.isPending || !preview.data?.valid} onClick={() => { setError(null); checkout.mutate({ draft: { forms: draft.forms } }); }} className="block h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-50">{checkout.isPending ? 'Confirmando…' : 'Confirmar compra'}</button>
        <button type="button" data-testid="button-back-adjust" onClick={() => navigate(back)} className="block h-12 w-full rounded-full text-[15px] font-semibold text-brand transition hover:bg-hover">Voltar e ajustar</button>
      </div>
    </div>
  </main>;
}
