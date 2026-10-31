import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useClearCart, useGetCart, useRemoveCartItem, useUpdateCartItem, type CartItem } from '@workspace/api-client-react';
import { CircleHelp, MoreHorizontal, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { BottomSheet } from '@/components/bottom-sheet';
import { useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { undoable } from '@/components/undo-snackbar';
import { resetCartDraft } from '@/lib/cart-draft';
import { money, plural } from '@/lib/format';

const iconButton = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-ink transition hover:bg-hover disabled:opacity-40';

// specs/carrinho.md RF-01, RF-02, D1, D13: a lista de produtos, a quantidade de cada um e o total fixo embaixo.
export default function Carrinho() {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const confirm = useConfirm();
  const { notice, failed } = useNotice();
  const [menu, setMenu] = useState(false);
  const cart = useGetCart();
  const refresh = () => { void client.invalidateQueries(); };
  const update = useUpdateCartItem({ mutation: { onSuccess: refresh, onError: failed } });
  const remove = useRemoveCartItem({ mutation: { onSuccess: refresh, onError: failed } });
  const clear = useClearCart({ mutation: { onSuccess: refresh, onError: failed } });
  const data = cart.data;
  const items = data?.items ?? [];

  const setQuantity = (item: CartItem, quantity: number) =>
    update.mutate({ itemId: item.id, data: { name: item.name, price: item.price, quantity, categoryId: item.categoryId, store: item.store } });
  const empty = async () => {
    setMenu(false);
    if (await confirm({ title: 'Esvaziar o carrinho?', text: 'Todos os produtos saem da lista. Nada foi lançado, então nenhum saldo muda.', confirmLabel: 'Esvaziar carrinho' })) clear.mutate();
  };
  const close = () => { resetCartDraft(); navigate('/carrinho/pagamento'); };

  return <main className="notebook-grain min-h-safe bg-paper pb-36 text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <div className="flex items-center justify-between">
        <BackButton onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}/>
        {items.length > 0 && <button type="button" data-testid="button-cart-menu" aria-label="Mais opções do carrinho" aria-haspopup="dialog" onClick={() => setMenu(true)} className={iconButton}><MoreHorizontal size={20}/></button>}
      </div>
      <section className="enter mt-1" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-eyebrow"><ShoppingCart size={14}/><p className="font-mono-data text-xs uppercase tracking-[.08em]">Nada é lançado agora</p></div>
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">Carrinho</h1>
      </section>

      {cart.isError ? <div data-testid="text-cart-error" className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div>
        <h2 className="mt-3 font-display text-[20px] text-ink">Não consegui abrir o carrinho.</h2>
        <button type="button" onClick={() => void cart.refetch()} className="mt-3 min-h-12 px-3 text-[15px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar de novo</button>
      </div>
        : !data ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[176px] animate-pulse rounded-2xl bg-line"/><div className="h-14 animate-pulse rounded-full bg-line"/></div>
        : items.length === 0 ? <section data-testid="section-cart-empty" aria-label="Carrinho vazio" className="enter mt-8 text-center" style={{ animationDelay: '.1s' }}>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-tint text-brand"><ShoppingCart size={28}/></div>
          <h2 className="mt-4 font-display text-[24px] leading-tight text-ink">Seu carrinho está vazio</h2>
          <p className="mx-auto mt-2 max-w-[320px] text-[15px] leading-6 text-ink-soft">Monte a lista do que pretende comprar. Só ao fechar você escolhe de onde o dinheiro sai.</p>
          <button type="button" data-testid="button-add-product" onClick={() => navigate('/carrinho/produto')} className="mt-5 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/>Adicionar produto</button>
        </section>
        : <>
          <ul data-testid="list-cart" className="enter mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" style={{ animationDelay: '.1s' }}>
            {items.map((item) => <li key={item.id} data-testid={`row-cart-${item.id}`} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <button type="button" aria-label={`Editar ${item.name}`} onClick={() => navigate(`/carrinho/produto/${item.id}`)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[16px] font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{item.name}</span>
                  <span className="block text-[13px] leading-snug text-ink-soft">{item.categoryName ?? 'Sem categoria'} · {money(item.price)}</span>
                </button>
                <span data-testid={`text-cart-item-total-${item.id}`} className="shrink-0 font-mono-data text-[16px] text-ink">{money(item.total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ${item.name}`}>
                  <button type="button" data-testid={`button-cart-minus-${item.id}`} aria-label={`Diminuir a quantidade de ${item.name}`} disabled={item.quantity <= 1 || update.isPending} onClick={() => setQuantity(item, item.quantity - 1)} className={iconButton}><Minus size={18}/></button>
                  <span data-testid={`text-cart-qty-${item.id}`} className="w-10 text-center font-mono-data text-[16px] text-ink">{item.quantity}</span>
                  <button type="button" data-testid={`button-cart-plus-${item.id}`} aria-label={`Aumentar a quantidade de ${item.name}`} disabled={item.quantity >= 99 || update.isPending} onClick={() => setQuantity(item, item.quantity + 1)} className={iconButton}><Plus size={18}/></button>
                </div>
                <button type="button" data-testid={`button-cart-remove-${item.id}`} aria-label={`Remover ${item.name}`} onClick={() => remove.mutate({ itemId: item.id }, undoable(item.name, `${item.name} removido.`))} className={`${iconButton} text-alert`}><Trash2 size={18}/></button>
              </div>
            </li>)}
          </ul>
          <button type="button" data-testid="button-add-product" onClick={() => navigate('/carrinho/produto')} className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-[15px] font-semibold text-brand transition hover:bg-hover"><Plus size={20}/>Adicionar produto</button>
        </>}
    </div>

    {data && items.length > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
        <div className="min-w-0"><span className="block text-[14px] text-ink-soft">Total · {plural(data.itemCount, 'item', 'itens')}</span><span data-testid="text-cart-total" className="block font-display text-[24px] leading-none text-ink [overflow-wrap:anywhere]">{money(data.total)}</span></div>
        <button type="button" data-testid="button-close-cart" onClick={close} className="h-14 shrink-0 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover">Fechar carrinho</button>
      </div>
    </div>}

    {menu && <BottomSheet title="Carrinho" onClose={() => setMenu(false)}>
      <button type="button" data-testid="button-empty-cart" onClick={() => void empty()} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left text-[15px] font-semibold text-alert transition hover:bg-hover"><Trash2 size={18}/>Esvaziar carrinho</button>
    </BottomSheet>}
    <Notice notice={notice}/>
  </main>;
}
