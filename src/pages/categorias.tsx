import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetCategoriesQueryKey, useCreateCategory, useDeleteCategory, useGetCategories, useUpdateCategory,
  type Category,
} from '@workspace/api-client-react';
import { ArrowLeft, Check, CircleHelp, FilePenLine, Tag, Trash2, X } from 'lucide-react';
import { plural } from '@/lib/format';

// The one place to create, rename and delete categories (specs/tela-de-categorias.md, D1).
// They are global: the cards' purchases, the daily expenses and the benefits share them.
export default function Categorias() {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const categoriesQuery = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey(), refetchOnWindowFocus: true } });
  const categories = categoriesQuery.data ?? [];
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  // RN-03: the other screens show the category in purchases, expenses and benefits, so they refresh too.
  const refresh = () => {
    for (const queryKey of [getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['installments'], ['benefits'], ['daily']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const notify = (text: string) => { setToast({ text }); window.setTimeout(() => setToast(null), 3200); };
  // Validation errors from the store are already written for the user.
  const failed = (error?: Error) => { setToast({ text: error?.message || 'Não foi possível salvar. Tente novamente.', error: true }); window.setTimeout(() => setToast(null), 4200); };
  const createCategory = useCreateCategory({ mutation: { onSuccess: () => { refresh(); setName(''); notify('Categoria criada.'); }, onError: failed } });
  const updateCategory = useUpdateCategory({ mutation: { onSuccess: () => { refresh(); setEditingId(null); notify('Categoria renomeada.'); }, onError: failed } });
  const deleteCategory = useDeleteCategory({ mutation: { onSuccess: () => { refresh(); notify('Categoria removida.'); }, onError: failed } });

  const create = (event: FormEvent) => { event.preventDefault(); createCategory.mutate({ data: { name } }); };
  const rename = (event: FormEvent) => { event.preventDefault(); if (editingId !== null) updateCategory.mutate({ categoryId: editingId, data: { name: editingName } }); };
  const remove = (category: Category) => {
    const effect = category.movementCount ? ` ${category.movementCount === 1 ? '1 compra ficará sem categoria.' : `${category.movementCount} compras ficarão sem categoria.`}` : '';
    if (window.confirm(`Excluir a categoria “${category.name}”?${effect} Esta ação não pode ser desfeita.`)) deleteCategory.mutate({ categoryId: category.id });
  };
  // RF-07: back to where the person came from; opened directly, there is nothing behind, so go home.
  const goBack = () => { if (window.history.length > 1) window.history.back(); else navigate('/'); };

  return <main className="notebook-grain min-h-safe bg-[#f5f1e7] text-[#294438]">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <header className="enter flex items-center justify-between border-b border-[#ded8ca] pb-5">
        <button data-testid="button-back" onClick={goBack} className="flex items-center gap-2 rounded-full border border-[#ded8ca] px-3.5 py-2 text-xs font-semibold text-[#546b5d] transition hover:bg-[#ece7dc]"><ArrowLeft size={14}/> Voltar</button>
      </header>

      <section className="enter mt-9 sm:mt-12" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-[#ac8f60]"><Tag size={14}/><p className="font-mono-data text-[10px] uppercase tracking-[.2em]">Para todos os cartões, gastos e benefícios</p></div>
        <h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-[-.03em] text-[#234638] sm:text-[54px]">Suas <em className="font-medium text-[#d78470]">categorias.</em></h1>
      </section>

      <form onSubmit={create} className="enter mt-8 flex gap-2" style={{ animationDelay: '.08s' }}>
        <input data-testid="input-category-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" aria-label="Nome da nova categoria" className="field-input"/>
        <button data-testid="button-add-category" disabled={createCategory.isPending} type="submit" className="shrink-0 rounded-full bg-[#28513f] px-5 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">Criar</button>
      </form>

      {categoriesQuery.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-14 rounded-2xl bg-[#e9e3d7]"/><div className="h-14 rounded-2xl bg-[#e9e3d7]"/></div>
      : categoriesQuery.isError ? <div className="mt-6 rounded-2xl border border-[#e1dbce] bg-[#fbf8f0] px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-[#315944]"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-[#345443]">Não conseguimos abrir as categorias.</h3><button onClick={() => void categoriesQuery.refetch()} className="mt-4 text-xs font-semibold text-[#42654e] underline decoration-[#a6b69f] underline-offset-4">Tentar novamente</button></div>
      : categories.length ? <ul data-testid="list-categories" className="enter mt-6 divide-y divide-[#ece6da] rounded-[22px] border border-[#e1dbce] bg-[#fbf8f0] px-4 sm:px-5" style={{ animationDelay: '.1s' }}>
        {categories.map((item) => <li key={item.id} data-testid={`row-category-${item.id}`} className="flex items-center gap-2 py-3">
          {editingId === item.id ? <form onSubmit={rename} className="flex min-w-0 flex-1 gap-2"><input autoFocus required maxLength={120} value={editingName} onChange={(e) => setEditingName(e.target.value)} aria-label={`Novo nome de ${item.name}`} className="field-input py-2"/><button type="submit" disabled={updateCategory.isPending} aria-label="Salvar nome" className="rounded-full p-2 text-[#315944] hover:bg-[#eee9df]"><Check size={15}/></button><button type="button" aria-label="Cancelar" onClick={() => setEditingId(null)} className="rounded-full p-2 text-[#718076] hover:bg-[#eee9df]"><X size={15}/></button></form>
          : <><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#345443]">{item.name}</span><span className="text-[10px] text-[#899186]">{plural(item.movementCount, 'compra', 'compras')}</span></span>
            <button aria-label={`Renomear ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><FilePenLine size={15}/></button>
            <button aria-label={`Excluir ${item.name}`} onClick={() => remove(item)} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={15}/></button></>}
        </li>)}
      </ul> : <p data-testid="text-categories-empty" className="mt-6 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-4 py-8 text-center text-xs leading-5 text-[#7d887c]">Nenhuma categoria ainda. Crie uma para separar seus gastos.</p>}
    </div>

    {toast && <div role="status" data-testid="status-toast" className={`fixed bottom-5 left-4 right-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:left-auto sm:right-5 sm:mx-0 ${toast.error ? 'bg-[#a85e50]' : 'bg-[#28513f]'}`}><Check size={14} className="shrink-0"/><span className="min-w-0">{toast.text}</span></div>}
  </main>;
}
