import { Plus } from 'lucide-react';
import { CARD_COLORS, type CardColor } from '@/lib/card-colors';

export type CarouselCard = {
  id: number; name: string; color: CardColor;
  invoiceAmount: number; movementCount: number;
};

// Fileira de botões que troca o cartão selecionado (specs/redesign-opcao-d-cartoes.md D1): o cartão
// selecionado fica em `ink`, com uma bolinha na cor dele; os outros têm borda e fundo `surface`.
export function CardPicker({ cards, selectedId, onSelect, onAdd }: {
  cards: CarouselCard[]; selectedId: number | null; onSelect: (cardId: number) => void; onAdd: () => void;
}) {
  return <div role="group" aria-label="Seus cartões" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
    {cards.map((card) => {
      const active = card.id === selectedId;
      return <button key={card.id} type="button" data-testid={`card-face-${card.id}`} aria-pressed={active} aria-label={`Cartão ${card.name}`} onClick={() => onSelect(card.id)}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition ${active ? 'border-ink bg-ink text-on-brand' : 'border-line bg-surface text-ink hover:bg-[#eee9dd]'}`}>
        <span aria-hidden className="h-3 w-3 rounded-full ring-1 ring-on-brand/60" style={{ background: CARD_COLORS[card.color].background }}/>{card.name}
      </button>;
    })}
    <button type="button" data-testid="button-add-card" aria-label="Adicionar cartão" onClick={onAdd} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-4 text-[14px] font-semibold text-ink-soft transition hover:bg-[#eee9dd]"><Plus size={16}/>Novo cartão</button>
  </div>;
}
