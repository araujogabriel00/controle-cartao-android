import { dialogOverlay } from '@/lib/dialog-styles';

// Bottom sheet with the secondary actions of a card or a benefit ("⋯"): edit and delete.
// Delete keeps its own confirmation; it only moves out of the face, away from the other buttons.
export function CardMenu({ title, editLabel, deleteLabel, onEdit, onDelete, onClose }: {
  title: string; editLabel: string; deleteLabel: string; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return <div className={`${dialogOverlay} flex items-end`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-label={title} className="enter mx-auto w-full max-w-[440px] rounded-t-[24px] border border-line bg-surface p-5 pb-6">
      <h2 className="mb-2 truncate font-display text-[22px] text-ink">{title}</h2>
      <button data-testid="button-edit-card" onClick={() => { onClose(); onEdit(); }} className="flex h-14 w-full items-center rounded-2xl px-3 text-left text-[16px] font-semibold text-ink transition hover:bg-paper">{editLabel}</button>
      <button data-testid="button-delete-card" onClick={() => { onClose(); onDelete(); }} className="flex h-14 w-full items-center rounded-2xl px-3 text-left text-[16px] font-semibold text-alert transition hover:bg-paper">{deleteLabel}</button>
      <button onClick={onClose} className="mt-2 h-12 w-full rounded-full border border-line text-[15px] font-semibold text-ink-soft transition hover:bg-paper">Fechar</button>
    </div>
  </div>;
}
