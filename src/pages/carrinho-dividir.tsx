import { useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useGetCart, useGetCartCoverage, useGetCartPaymentPreview, useSuggestCart, type CartFormInput } from '@workspace/api-client-react';
import { Check, CircleHelp, Plus, Sparkles, X } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { BottomSheet } from '@/components/bottom-sheet';
import { BalanceEffect, FORM_ICON, FormEffect, InstallmentChips } from '@/components/cart-parts';
import { HiddenChart } from '@/components/charts/chart-table';
import { SHARE_COLORS } from '@/components/dream-parts';
import { draftKey, setCartDraft, useCartDraft } from '@/lib/cart-draft';
import { currentMonth, money } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';

const round = (value: number) => Math.round(value * 100) / 100;

function DividirScreen({ total }: { total: number }) {
  const [, navigate] = useLocation();
  const draft = useCartDraft();
  const coverage = useGetCartCoverage();
  const suggest = useSuggestCart();
  const forms = draft.forms;
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(forms.map((f) => [draftKey(f), String(f.amount)])));
  const [adding, setAdding] = useState(false);
  const preview = useGetCartPaymentPreview({ forms }, { query: { enabled: forms.length > 0 } });
  const month = currentMonth();
  const allocated = round(forms.reduce((n, f) => n + (Number.isFinite(f.amount) ? f.amount : 0), 0));
  const left = round(total - allocated);
  const info = coverage.data;

  const replace = (next: CartFormInput[]) => { setCartDraft({ forms: next, warning: null }); setTexts(Object.fromEntries(next.map((f) => [draftKey(f), String(f.amount)]))); };
  const patch = (key: string, change: Partial<CartFormInput>) => setCartDraft({ forms: forms.map((f) => (draftKey(f) === key ? { ...f, ...change } : f)), warning: null });
  const remove = (key: string) => replace(forms.filter((f) => draftKey(f) !== key));
  const add = (form: Omit<CartFormInput, 'amount'>) => {
    const room = form.kind === 'benefit' ? info?.benefits.find((b) => b.id === form.id)?.coverage ?? 0 : Infinity;
    replace([...forms, { ...form, amount: round(Math.max(0, Math.min(left, room))) }]);
    setAdding(false);
  };
  const nameOf = (form: CartFormInput) => (form.kind === 'balance' ? 'Saldo da conta' : form.kind === 'card' ? `Cartão ${info?.cards.find((c) => c.id === form.id)?.name ?? ''}` : info?.benefits.find((b) => b.id === form.id)?.name ?? 'Benefício');
  const used = new Set(forms.map(draftKey));
  const choices: (Omit<CartFormInput, 'amount'> & { label: string })[] = info ? [
    ...info.benefits.map((b) => ({ kind: 'benefit' as const, id: b.id, label: b.name })),
    ...info.cards.map((c) => ({ kind: 'card' as const, id: c.id, installments: 1, label: `Cartão ${c.name}` })),
    { kind: 'balance' as const, label: 'Saldo da conta' },
  ].filter((c) => !used.has(draftKey({ ...c, amount: 0 }))) : [];
  const ok = left === 0 && forms.length > 0 && Boolean(preview.data?.valid);

  return <main className="notebook-grain min-h-safe bg-paper pb-44 text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <BackButton onClick={() => navigate('/carrinho/pagamento')}/>
      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <h1 className="font-display text-[28px] leading-tight text-ink">Dividir pagamento</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Total <span className="font-mono-data text-ink">{money(total)}</span></p>
        <p data-testid="text-left-to-allocate" role="status" className={`mt-1 flex items-center gap-2 text-[16px] font-semibold ${left === 0 ? 'text-brand' : 'text-alert'}`}>
          {left === 0 ? <><Check aria-hidden size={18}/>Tudo alocado · Falta alocar {money(0)}</> : left > 0 ? `Falta alocar ${money(left)}` : `Passou ${money(-left)} do total`}
        </p>
      </section>

      <div className="mt-3" aria-hidden>
        {isHidden() ? <HiddenChart height={12}/> : <div data-testid="chart-split" className="flex h-3 gap-0.5 overflow-hidden rounded bg-chart-track">{forms.map((f, i) => <span key={draftKey(f)} className={`h-full ${SHARE_COLORS[i % SHARE_COLORS.length]}`} style={{ width: `${total > 0 ? Math.min(100, (Math.max(0, f.amount) / total) * 100) : 0}%` }}/>)}</div>}
      </div>

      {draft.warning && <p role="alert" data-testid="text-split-warning" className="mt-4 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{draft.warning}</p>}

      {coverage.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir as formas de pagamento.</h2><button type="button" onClick={() => void coverage.refetch()} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button></div>
        : <ul className="mt-4 space-y-3">
          {forms.map((form, index) => {
            const key = draftKey(form);
            const Icon = FORM_ICON[form.kind];
            const shown = preview.data?.forms[index];
            const limit = form.kind === 'benefit' ? info?.benefits.find((b) => b.id === form.id)?.coverage : undefined;
            return <li key={key} data-testid={`card-origin-${key}`} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Icon size={20}/></span>
                <span className="min-w-0 flex-1 text-[16px] font-semibold text-ink [overflow-wrap:anywhere]">{nameOf(form)}</span>
                <button type="button" data-testid={`button-remove-form-${key}`} aria-label={`Remover ${nameOf(form)}`} onClick={() => remove(key)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover"><X size={18}/></button>
              </div>
              <label htmlFor={`input-alloc-${key}`} className="field-label mt-3">Valor</label>
              <div className="relative"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span>
                <input id={`input-alloc-${key}`} data-testid={`input-alloc-${key}`} type="number" min="0" step="0.01" inputMode="decimal" value={texts[key] ?? ''}
                  onChange={(e) => { setTexts((current) => ({ ...current, [key]: e.target.value })); patch(key, { amount: Number(e.target.value) || 0 }); }} className="field-input pl-12 text-[18px]"/>
              </div>
              {limit !== undefined && <p className="mt-1 text-[13px] leading-snug text-ink-soft">Este benefício cobre até {money(limit)} deste carrinho.</p>}
              {form.kind === 'card' && <InstallmentChips value={form.installments ?? 1} total={form.amount} onChange={(installments) => patch(key, { installments })}/>}
              {shown?.issue && <p role="alert" data-testid={`text-origin-issue-${key}`} className="mt-2 text-[14px] font-semibold leading-5 text-alert">{shown.issue}</p>}
              {shown && !shown.issue && <div className="mt-2"><FormEffect form={shown} month={month}/></div>}
            </li>;
          })}
        </ul>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" data-testid="button-add-origin" disabled={choices.length === 0} onClick={() => setAdding(true)} className="flex h-14 items-center justify-center gap-2 rounded-full border border-line px-3 text-[15px] font-semibold text-ink transition hover:bg-hover disabled:opacity-50"><Plus size={18}/>Adicionar outra forma</button>
        <button type="button" data-testid="button-suggest-split" disabled={suggest.isPending} onClick={() => suggest.mutate(undefined, { onSuccess: replace })} className="flex h-14 items-center justify-center gap-2 rounded-full border border-line px-3 text-[15px] font-semibold text-brand transition hover:bg-hover disabled:opacity-50"><Sparkles size={18}/>Sugerir divisão</button>
      </div>
      {preview.data && forms.length > 0 && <div className="mt-4"><BalanceEffect testId="text-split-balance" preview={preview.data}/></div>}
      {preview.data && left === 0 && preview.data.issues.length > 0 && !preview.data.forms.some((f) => f.issue) && <p role="alert" className="mt-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{preview.data.issues.join(' ')}</p>}
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <button type="button" data-testid="button-continue-payment" disabled={!ok} onClick={() => navigate('/carrinho/confirmar')} className="mx-auto block h-14 w-full max-w-[440px] rounded-full bg-brand px-4 text-base font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-50">Continuar</button>
    </div>

    {adding && <BottomSheet title="Adicionar forma" onClose={() => setAdding(false)}>
      <div className="space-y-2">
        {choices.map(({ label, ...form }) => <button key={draftKey({ ...form, amount: 0 })} type="button" data-testid={`add-origin-${draftKey({ ...form, amount: 0 })}`} onClick={() => add(form)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left text-[15px] font-semibold text-ink transition hover:bg-hover">{label}</button>)}
      </div>
    </BottomSheet>}
  </main>;
}

// specs/carrinho.md RF-06, D8, D9, RN-06: o total repartido por valor entre as formas; "Continuar" só ativa com tudo alocado.
export default function CarrinhoDividir() {
  const draft = useCartDraft();
  const cart = useGetCart();
  // RN-03: o rascunho só vive na memória; sem ele (recarregou o app) volta para o carrinho.
  if (draft.mode !== 'split' || (cart.data && cart.data.items.length === 0)) return <Redirect to="/carrinho" replace />;
  if (!cart.data) return <main className="notebook-grain min-h-safe bg-paper"><div aria-busy="true" className="mx-auto mt-24 h-[240px] max-w-[440px] animate-pulse rounded-2xl bg-line"/></main>;
  return <DividirScreen total={cart.data.total}/>;
}
