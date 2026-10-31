import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocation } from 'wouter';
import {
  getGetCategoriesQueryKey, useAddCartItem, useGetCart, useGetCategories, useRemoveCartItem, useUpdateCartItem,
  type CartItem, type Category,
} from '@workspace/api-client-react';
import { Check, Trash2 } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { showUndo } from '@/components/undo-snackbar';

type Fields = { name: string; price: string; quantity: string; categoryId: string; store: string };
const blank: Fields = { name: '', price: '', quantity: '1', categoryId: '', store: '' };

function ProductForm({ item, categories }: { item?: CartItem; categories: Category[] }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const [fields, setFields] = useState<Fields>(item ? { name: item.name, price: String(item.price), quantity: String(item.quantity), categoryId: item.categoryId ? String(item.categoryId) : '', store: item.store } : blank);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const refresh = () => { void client.invalidateQueries(); };
  const add = useAddCartItem({ mutation: { onError: (e) => setError(e.message) } });
  const update = useUpdateCartItem({ mutation: { onError: (e) => setError(e.message) } });
  const remove = useRemoveCartItem({ mutation: { onError: (e) => setError(e.message) } });
  const busy = add.isPending || update.isPending || remove.isPending;
  const set = (key: keyof Fields) => (value: string) => setFields((current) => ({ ...current, [key]: value }));
  const data = () => ({ name: fields.name, price: Number(fields.price), quantity: Number(fields.quantity), categoryId: fields.categoryId ? Number(fields.categoryId) : null, store: fields.store });

  // RF-03: "Adicionar" volta para o carrinho; "Adicionar e outro" limpa o formulário e fica.
  const save = (more: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    setError(null);
    setAdded(false);
    if (item) update.mutate({ itemId: item.id, data: data() }, { onSuccess: () => { refresh(); navigate('/carrinho'); } });
    else add.mutate({ data: data() }, { onSuccess: () => { refresh(); if (more) { setFields({ ...blank, categoryId: fields.categoryId }); setAdded(true); } else navigate('/carrinho'); } });
  };
  const removeItem = () => {
    if (item) remove.mutate({ itemId: item.id }, { onSuccess: (result) => { refresh(); navigate('/carrinho'); showUndo({ undoId: result.undoId, label: item.name, text: `${item.name} removido.` }); } });
  };

  return <form data-testid="form-product" onSubmit={save(false)} className="mt-5 pb-40">
    <label htmlFor="input-product-name" className="field-label">Produto</label>
    <input id="input-product-name" data-testid="input-product-name" required maxLength={120} value={fields.name} onChange={(e) => set('name')(e.target.value)} placeholder="Ex.: Fone de ouvido" className="field-input mb-4"/>

    <div className="mb-4 grid grid-cols-[1fr_96px] gap-3">
      <div>
        <label htmlFor="input-product-price" className="field-label">Preço (unidade)</label>
        <div className="relative"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span>
          <input id="input-product-price" data-testid="input-product-price" required type="number" min="0.01" step="0.01" inputMode="decimal" value={fields.price} onChange={(e) => set('price')(e.target.value)} placeholder="0,00" className="field-input pl-12"/>
        </div>
      </div>
      <div>
        <label htmlFor="input-product-qty" className="field-label">Qtd.</label>
        <input id="input-product-qty" data-testid="input-product-qty" required type="number" min="1" max="99" step="1" inputMode="numeric" value={fields.quantity} onChange={(e) => set('quantity')(e.target.value)} className="field-input"/>
      </div>
    </div>

    <label htmlFor="select-product-category" className="field-label">Categoria</label>
    <select id="select-product-category" data-testid="select-product-category" value={fields.categoryId} onChange={(e) => set('categoryId')(e.target.value)} className="field-input mb-4 appearance-none">
      <option value="">Sem categoria</option>
      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>

    <label htmlFor="input-product-store" className="field-label">Loja ou link (opcional)</label>
    <input id="input-product-store" data-testid="input-product-store" maxLength={120} value={fields.store} onChange={(e) => set('store')(e.target.value)} placeholder="Ex.: Mercado da esquina" className="field-input"/>
    <p className="mb-4 mt-1 text-[14px] text-ink-soft">Só uma anotação: o app não abre nem confere o link.</p>

    {added && <p role="status" data-testid="text-product-added" className="mb-3 flex items-center gap-2 rounded-xl bg-tint px-3 py-2.5 text-[14px] font-semibold text-brand"><Check size={16}/>Produto adicionado. Pode lançar o próximo.</p>}
    {error && <p role="alert" data-testid="text-form-error" className="mb-3 rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
    {item && <button type="button" data-testid="button-remove-product" disabled={busy} onClick={removeItem} className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-[15px] font-semibold text-alert transition hover:bg-hover"><Trash2 size={18}/>Remover produto</button>}

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-3">
      <div className="mx-auto flex max-w-[440px] gap-2">
        {!item && <button type="button" data-testid="button-save-product-more" disabled={busy} onClick={() => save(true)()} className="h-14 flex-1 rounded-full border border-line px-3 text-[15px] font-semibold text-ink transition hover:bg-hover disabled:opacity-60">Adicionar e outro</button>}
        <button data-testid="button-save-product" disabled={busy} type="submit" className="h-14 flex-1 rounded-full bg-brand px-3 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">{busy ? 'Salvando…' : item ? 'Salvar produto' : 'Adicionar'}</button>
      </div>
    </div>
  </form>;
}

// specs/carrinho.md RF-03, D14: adicionar um produto, ou editar o que já está no carrinho (com "Remover produto").
export default function CarrinhoProduto({ itemId }: { itemId?: number }) {
  const [, navigate] = useLocation();
  const cart = useGetCart();
  const categories = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } });
  const item = itemId === undefined ? undefined : cart.data?.items.find((i) => i.id === itemId);
  if (itemId !== undefined && cart.data && !item) return <Redirect to="/carrinho" replace />;
  const ready = Boolean(categories.data || categories.isError) && (itemId === undefined || Boolean(item));
  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8">
      <BackButton onClick={() => navigate('/carrinho')}/>
      <h1 className="enter mt-3 font-display text-[28px] leading-tight text-ink">{itemId === undefined ? 'Adicionar produto' : 'Editar produto'}</h1>
      <p className="mt-1 text-[14px] text-ink-soft">Nada é lançado agora.</p>
      {ready ? <ProductForm key={item?.id ?? 'novo'} item={item} categories={categories.data ?? []}/> : <div aria-busy="true" className="mt-6 h-[320px] animate-pulse rounded-2xl bg-line"/>}
    </div>
  </main>;
}
