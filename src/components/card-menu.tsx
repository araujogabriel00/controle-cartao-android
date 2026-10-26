import { BottomSheet } from '@/components/bottom-sheet';

// Bottom sheet with the secondary actions of a card, a benefit or a list row ("⋯"): edit and delete.
// Delete keeps its own confirmation; it only moves out of the face, away from the other buttons.
export function CardMenu({ title, editLabel, deleteLabel, editTestId = 'button-edit-card', deleteTestId = 'button-delete-card', onEdit, onDelete, onClose }: {
  title: string; editLabel: string; deleteLabel: string; editTestId?: string; deleteTestId?: string; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return <BottomSheet title={title} onClose={onClose}>
    <button data-testid={editTestId} onClick={() => { onClose(); onEdit(); }} className="flex h-14 w-full items-center rounded-2xl px-3 text-left text-[16px] font-semibold text-ink transition hover:bg-paper">{editLabel}</button>
    <button data-testid={deleteTestId} onClick={() => { onClose(); onDelete(); }} className="flex h-14 w-full items-center rounded-2xl px-3 text-left text-[16px] font-semibold text-alert transition hover:bg-paper">{deleteLabel}</button>
  </BottomSheet>;
}
