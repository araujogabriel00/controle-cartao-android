import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetCategoriesQueryKey, useCreateCategory, useDeleteCategory, useGetCategories, useUpdateCategory,
  type Category,
} from '@workspace/api-client-react';
import { CircleHelp, Tag } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { FormActions, FormSheet, SheetHeader } from '@/components/bottom-sheet';
import { useConfirm } from '@/components/confirm-dialog';
import { Notice, useNotice } from '@/components/notice';
import { RowMenu } from '@/components/row-menu';
import { dialogPanel } from '@/lib/dialog-styles';
import { plural } from '@/lib/format';

// Renomear abre como folha (specs/redesign-opcao-d-telas-de-apoio.md D3); criar continua inline, com um campo e um botão.
function RenameSheet({ category, busy, error, onClose, onSave }: { category: Category; busy: boolean; error: string | null; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(category.name);
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(name); };
  return <FormSheet onClose={onClose}>
    <form onSubmit={submit} className={dialogPanel}>
      <SheetHeader kicker="Categoria" title="Renomear categoria" onClose={onClose}/>
      <label htmlFor="input-category-rename" className="field-label">Nome</label>
      <input id="input-category-rename" data-testid="input-category-rename" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="field-input mb-4"/>
      <FormActions busy={busy} isEdit onClose={onClose} error={error}/>
    </form>
  </FormSheet>;
}

// The one place to create, rename and delete categories (specs/tela-de-categorias.md, D1).
// They are global: the cards' purchases, the daily expenses and the benefits share them.
export default function Categorias() {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const confirm = useConfirm();
  const categoriesQuery = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey(), refetchOnWindowFocus: true } });
  const categories = categoriesQuery.data ?? [];
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<Category | null>(null);
  const { notice, notify, failed, formError } = useNotice(Boolean(renaming));

  // RN-03: the other screens show the category in purchases, expenses and benefits, so they refresh too.
  const refresh = () => {
    for (const queryKey of [getGetCategoriesQueryKey(), ['movements'], ['category-summary'], ['installments'], ['benefits'], ['daily']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const createCategory = useCreateCategory({ mutation: { onSuccess: () => { refresh(); setName(''); notify('Categoria criada.'); }, onError: failed } });
  const updateCategory = useUpdateCategory({ mutation: { onSuccess: () => { refresh(); setRenaming(null); notify('Categoria renomeada.'); }, onError: failed } });
  const deleteCategory = useDeleteCategory({ mutation: { onSuccess: () => { refresh(); notify('Categoria removida.'); }, onError: failed } });

  const create = (event: FormEvent) => { event.preventDefault(); createCategory.mutate({ data: { name } }); };
  const remove = async (category: Category) => {
    const effect = category.movementCount ? (category.movementCount === 1 ? '1 compra ficará sem categoria.' : `${category.movementCount} compras ficarão sem categoria.`) : '';
    if (await confirm({ title: `Excluir a categoria “${category.name}”?`, text: `${effect ? `${effect} ` : ''}Esta ação não pode ser desfeita.`, confirmLabel: 'Excluir' })) deleteCategory.mutate({ categoryId: category.id });
  };
  // RF-07: back to where the person came from; opened directly, there is nothing behind, so go home.
  const goBack = () => { if (window.history.length > 1) window.history.back(); else navigate('/'); };

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className="relative z-10 mx-auto max-w-[860px] px-4 pb-12 pt-5 sm:px-8">
      <BackButton onClick={goBack}/>

      <section className="enter mt-3" style={{ animationDelay: '.06s' }}>
        <div className="flex items-center gap-2 text-eyebrow"><Tag size={14}/><p className="font-mono-data text-xs uppercase tracking-[.08em]">Para todos os cartões, gastos e benefícios</p></div>
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">Suas categorias</h1>
      </section>

      <form onSubmit={create} className="enter mt-5 flex items-center gap-2" style={{ animationDelay: '.08s' }}>
        <input data-testid="input-category-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" aria-label="Nome da nova categoria" className="field-input"/>
        <button data-testid="button-add-category" disabled={createCategory.isPending} type="submit" className="h-[52px] shrink-0 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-[#1f4333] disabled:opacity-60">Criar</button>
      </form>

      {categoriesQuery.isLoading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-14 rounded-2xl bg-line"/><div className="h-14 rounded-2xl bg-line"/></div>
      : categoriesQuery.isError ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e9e3d7] text-brand"><CircleHelp size={18}/></div><h3 className="mt-3 font-display text-[20px] text-ink">Não conseguimos abrir as categorias.</h3><button onClick={() => void categoriesQuery.refetch()} className="mt-3 min-h-11 text-[14px] font-semibold text-brand underline decoration-brand/40 underline-offset-4">Tentar novamente</button></div>
      : categories.length ? <ul data-testid="list-categories" className="enter mt-5 divide-y divide-line border-y border-line" style={{ animationDelay: '.1s' }}>
        {categories.map((item) => <li key={item.id} data-testid={`row-category-${item.id}`} className="flex items-center gap-1">
          <button type="button" aria-label={`Renomear ${item.name}`} onClick={() => setRenaming(item)} className="flex min-h-16 min-w-0 flex-1 flex-col justify-center py-3 text-left transition hover:bg-surface">
            <span className="block truncate text-[15px] font-semibold text-ink">{item.name}</span>
            <span className="text-[13px] text-ink-soft">{plural(item.movementCount, 'compra', 'compras')}</span>
          </button>
          <RowMenu title={item.name} editLabel="Renomear" deleteLabel="Excluir" editTestId={`button-rename-category-${item.id}`} deleteTestId={`button-delete-category-${item.id}`} onEdit={() => setRenaming(item)} onDelete={() => void remove(item)}/>
        </li>)}
      </ul> : <p data-testid="text-categories-empty" className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-[14px] leading-5 text-ink-soft">Nenhuma categoria ainda. Crie uma para separar seus gastos.</p>}
    </div>

    {renaming && <RenameSheet key={renaming.id} category={renaming} busy={updateCategory.isPending} error={formError} onClose={() => setRenaming(null)} onSave={(value) => updateCategory.mutate({ categoryId: renaming.id, data: { name: value } })}/>}
    <Notice notice={notice}/>
  </main>;
}
