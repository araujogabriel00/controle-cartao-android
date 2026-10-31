import { Redirect, useLocation } from 'wouter';
import { Check } from 'lucide-react';
import { FORM_ICON } from '@/components/cart-parts';
import { useFirstShow } from '@/components/dream-parts';
import { resetCartDraft, useCartDraft } from '@/lib/cart-draft';
import { areaPath, currentMonth, money, plural } from '@/lib/format';

// specs/carrinho.md RF-08, D11: o que o fechamento criou, por forma, com "Ver lançamentos" e "Voltar ao início".
export default function CarrinhoOk() {
  const [, navigate] = useLocation();
  const { result } = useCartDraft();
  const animate = useFirstShow('carrinho-ok');
  if (!result) return <Redirect to="/carrinho" replace />;

  const leave = (path: string) => { resetCartDraft(); navigate(path); };
  return <main data-testid="screen-cart-done" className="notebook-grain min-h-safe bg-paper pb-40 text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-14 sm:px-8">
      <div className="mx-auto max-w-[440px] text-center">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-on-brand ${animate ? 'dream-pop' : ''}`}><Check aria-hidden size={32} strokeWidth={2.5}/></span>
        <h1 className="mt-4 font-display text-[30px] leading-tight text-ink">Compra registrada</h1>
        <p className="mt-1 text-[16px] text-ink-soft">Total <span data-testid="text-done-total" className="font-mono-data text-ink">{money(result.total)}</span></p>
      </div>

      <ul data-testid="list-done-forms" className="mx-auto mt-6 max-w-[440px] space-y-3">
        {result.forms.map((form) => {
          const Icon = FORM_ICON[form.kind];
          return <li key={form.key} data-testid={`done-${form.key.replace(':', '-')}`} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Icon size={20}/></span>
              <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold text-ink [overflow-wrap:anywhere]">{form.name}</span><span className="block text-[14px] text-ink-soft">{plural(form.entries.length, 'lançamento', 'lançamentos')}{form.installments > 1 ? ` · ${form.installments}x` : ''}</span></span>
              <span className="shrink-0 font-mono-data text-[16px] text-ink">{money(form.amount)}</span>
            </div>
            <ul className="mt-2 divide-y divide-line text-[14px]">
              {form.entries.map((entry, index) => <li key={`${entry.description}-${index}`} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 text-ink-soft [overflow-wrap:anywhere]">{entry.description}</span><span className="shrink-0 font-mono-data text-ink">{money(entry.amount)}</span></li>)}
            </ul>
          </li>;
        })}
      </ul>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <div className="mx-auto max-w-[440px] space-y-2">
        <button type="button" data-testid="button-see-entries" onClick={() => leave(areaPath(result.topArea, currentMonth()))} className="block h-14 w-full rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover">Ver lançamentos</button>
        <button type="button" data-testid="button-back-home" onClick={() => leave('/')} className="block h-12 w-full rounded-full text-[15px] font-semibold text-brand transition hover:bg-hover">Voltar ao início</button>
      </div>
    </div>
  </main>;
}
