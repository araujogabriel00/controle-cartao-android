import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { CardMenu } from '@/components/card-menu';

// O "⋯" de 44 px de uma linha, com a folha "Editar / Excluir" (specs/redesign-opcao-d-telas-de-apoio.md D2).
// Os `data-testid` de editar e excluir ficam nos itens da folha.
export function RowMenu({ title, menuTestId, editTestId, deleteTestId, editLabel = 'Editar', deleteLabel = 'Excluir', onEdit, onDelete }: {
  title: string; menuTestId?: string; editTestId?: string; deleteTestId?: string; editLabel?: string; deleteLabel?: string; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" data-testid={menuTestId} aria-label={`Mais opções de ${title}`} onClick={() => setOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover"><MoreHorizontal size={20}/></button>
    {open && <CardMenu title={title} editLabel={editLabel} deleteLabel={deleteLabel} editTestId={editTestId} deleteTestId={deleteTestId} onClose={() => setOpen(false)} onEdit={onEdit} onDelete={onDelete}/>}
  </>;
}
