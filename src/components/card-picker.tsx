import { Plus } from 'lucide-react';
import { CARD_COLORS, type CardColor } from '@/lib/card-colors';

export type PickerItem = { id: number; name: string; color?: CardColor };
export type CarouselCard = PickerItem & {
  color: CardColor; invoiceAmount: number; movementCount: number;
};

// Fileira de botões que troca o item selecionado (cartão ou benefício; specs/redesign-opcao-d-cartoes.md D1
// e redesign-opcao-d-beneficios.md D1): o selecionado fica em `ink`, com uma bolinha de cor; os outros têm borda
// e fundo `surface`. Os textos e os `data-testid` mudam conforme a aba; `dot` força a cor da bolinha.
export function CardPicker<T extends PickerItem>({
  cards, selectedId, onSelect, onAdd, groupLabel = 'Seus cartões', itemLabel = (item) => `Cartão ${item.name}`,
  faceTestId = 'card-face', addTestId = 'button-add-card', addText = 'Novo cartão', addLabel = 'Adicionar cartão', dot,
}: {
  cards: T[]; selectedId: number | null; onSelect: (id: number) => void; onAdd: () => void;
  groupLabel?: string; itemLabel?: (item: T) => string; faceTestId?: string; addTestId?: string; addText?: string; addLabel?: string; dot?: string;
}) {
  return <div role="group" aria-label={groupLabel} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
    {cards.map((card) => {
      const active = card.id === selectedId;
      return <button key={card.id} type="button" data-testid={`${faceTestId}-${card.id}`} aria-pressed={active} aria-label={itemLabel(card)} onClick={() => onSelect(card.id)}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition ${active ? 'border-ink bg-ink text-on-brand' : 'border-line bg-surface text-ink hover:bg-hover'}`}>
        <span aria-hidden className="h-3 w-3 rounded-full ring-1 ring-on-brand/60" style={{ background: dot ?? CARD_COLORS[card.color ?? 'grafite'].background }}/>{card.name}
      </button>;
    })}
    <button type="button" data-testid={addTestId} aria-label={addLabel} onClick={onAdd} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-4 text-[14px] font-semibold text-ink-soft transition hover:bg-hover"><Plus size={16}/>{addText}</button>
  </div>;
}
