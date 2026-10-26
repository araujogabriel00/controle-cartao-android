import { useState } from 'react';
import { History, MoreHorizontal } from 'lucide-react';
import { CardMenu } from '@/components/card-menu';
import { SnapCarousel } from '@/components/snap-carousel';
import { type CardColor } from '@/lib/card-colors';
import { isFutureMonth, money, monthLabel, plural, type MonthKey } from '@/lib/format';

export type CarouselCard = {
  id: number; name: string; color: CardColor;
  invoiceAmount: number; movementCount: number;
};

const faceButton = 'grid h-11 w-11 place-items-center rounded-full border border-white/[.28] text-white/90 transition hover:bg-white/10';

// Wallet-style card picker: see SnapCarousel. Only the face of each card lives here;
// edit and delete sit behind the "⋯" sheet (specs/redesign-cartoes.md D2).
export function CardCarousel({ cards, month, selectedId, onSelect, onAdd, onEdit, onDelete, onHistory }: {
  cards: CarouselCard[]; month: MonthKey; selectedId: number | null;
  onSelect: (cardId: number) => void; onAdd: () => void;
  onEdit: (card: CarouselCard) => void; onDelete: (card: CarouselCard) => void; onHistory: () => void;
}) {
  const [menuCard, setMenuCard] = useState<CarouselCard | null>(null);
  return <>
    <SnapCarousel items={cards} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd}
      region="Seus cartões" faceTestId="card-face" itemLabel={(card) => `Cartão ${card.name}`}
      add={{ testId: 'button-add-card', title: 'Adicionar cartão', text: 'Cada cartão tem suas compras e a fatura de cada mês.', ariaLabel: 'Adicionar cartão' }}
      renderFace={(card, active) => <>
        <div className="relative flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 min-w-0 font-display text-[26px] leading-tight [overflow-wrap:anywhere]">{card.name}</h2>
          <div className={`flex shrink-0 gap-2 ${active ? '' : 'invisible'}`}>
            <button aria-label={`Ver histórico de ${card.name}`} data-testid="button-history" tabIndex={active ? 0 : -1} onClick={onHistory} className={faceButton}><History size={18}/></button>
            <button aria-label="Mais opções do cartão" data-testid="button-card-menu" tabIndex={active ? 0 : -1} onClick={() => setMenuCard(card)} className={faceButton}><MoreHorizontal size={20}/></button>
          </div>
        </div>
        <div className="relative mt-6 min-w-0"><p className="text-[13px] text-[#fffaf0]/[.84]">{isFutureMonth(month) ? 'Fatura prevista de' : 'Fatura de'} {monthLabel(month)}</p><p className="mt-1 font-display text-[42px] leading-[1.15] tracking-[-.03em] [overflow-wrap:anywhere]">{money(card.invoiceAmount)}</p></div>
        <p className="relative mt-3 text-[13px] text-[#fffaf0]/[.84]">{card.movementCount === 0 ? 'Nenhuma compra neste mês.' : plural(card.movementCount, 'compra', 'compras')}</p>
      </>}/>
    {menuCard && <CardMenu title={menuCard.name} editLabel="Editar cartão" deleteLabel="Excluir cartão" onClose={() => setMenuCard(null)} onEdit={() => onEdit(menuCard)} onDelete={() => onDelete(menuCard)}/>}
  </>;
}
