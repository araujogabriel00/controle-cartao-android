import { type FormEvent, type MouseEvent, useState } from 'react';
import { Check, FilePenLine, Trash2, X } from 'lucide-react';
import { type Category } from '@workspace/api-client-react';
import { dialogOverlay, dialogPanel } from '@/lib/dialog-styles';
import { plural } from '@/lib/format';

// The global category list, shared by every card and by the benefits.
export function CategoriesDialog({ categories, busy, onClose, onCreate, onRename, onDelete }: {
  categories: Category[]; busy: boolean; onClose: () => void;
  onCreate: (name: string) => void; onRename: (id: number, name: string) => void; onDelete: (category: Category) => void;
}) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  const create = (event: FormEvent) => { event.preventDefault(); onCreate(name); setName(''); };
  const rename = (event: FormEvent) => { event.preventDefault(); if (editingId !== null) onRename(editingId, editingName); setEditingId(null); };
  return <div className={dialogOverlay} onMouseDown={closeOnBackdrop}>
    <div className="h-full overflow-y-auto overscroll-contain" onMouseDown={closeOnBackdrop}>
    <div className="flex min-h-full p-4" onMouseDown={closeOnBackdrop}>
    <div role="dialog" aria-modal="true" aria-labelledby="categories-title" className={dialogPanel}>
      <div className="mb-5 flex items-start justify-between"><div><span className="font-mono-data text-[10px] uppercase tracking-[.18em] text-[#8a8e78]">Para todos os cartões</span><h2 id="categories-title" className="mt-2 font-display text-[30px] leading-tight text-[#234638]">Categorias</h2></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><X size={18}/></button></div>
      <form onSubmit={create} className="flex gap-2"><input data-testid="input-category-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" aria-label="Nome da nova categoria" className="field-input"/><button data-testid="button-add-category" disabled={busy} type="submit" className="shrink-0 rounded-full bg-[#28513f] px-4 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#1f4333] disabled:opacity-60">Criar</button></form>
      {categories.length ? <ul data-testid="list-categories" className="mt-5 divide-y divide-[#ece6da]">
        {categories.map((item) => <li key={item.id} data-testid={`row-category-${item.id}`} className="flex items-center gap-2 py-2.5">
          {editingId === item.id ? <form onSubmit={rename} className="flex min-w-0 flex-1 gap-2"><input autoFocus required maxLength={120} value={editingName} onChange={(e) => setEditingName(e.target.value)} aria-label={`Novo nome de ${item.name}`} className="field-input py-2"/><button type="submit" aria-label="Salvar nome" className="rounded-full p-2 text-[#315944] hover:bg-[#eee9df]"><Check size={15}/></button><button type="button" aria-label="Cancelar" onClick={() => setEditingId(null)} className="rounded-full p-2 text-[#718076] hover:bg-[#eee9df]"><X size={15}/></button></form>
          : <><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#345443]">{item.name}</span><span className="text-[10px] text-[#899186]">{plural(item.movementCount, 'compra', 'compras')}</span></span>
            <button aria-label={`Renomear ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className="rounded-full p-2 text-[#718076] transition hover:bg-[#eee9df]"><FilePenLine size={14}/></button>
            <button aria-label={`Excluir ${item.name}`} onClick={() => onDelete(item)} className="rounded-full p-2 text-[#a36354] transition hover:bg-[#f5e9e1]"><Trash2 size={14}/></button></>}
        </li>)}
      </ul> : <p className="mt-5 rounded-2xl border border-dashed border-[#d9d2c4] bg-[#f8f5ed] px-4 py-6 text-center text-xs leading-5 text-[#7d887c]">Nenhuma categoria ainda. Crie uma para separar seus gastos.</p>}
      <button onClick={onClose} className="mt-6 w-full rounded-full border border-[#dcd5c8] px-4 py-3 text-sm font-semibold text-[#546b5d] transition hover:bg-[#f1ede3]">Fechar</button>
    </div>
    </div>
    </div>
  </div>;
}
