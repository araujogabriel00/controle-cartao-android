import { FilePenLine, History, Trash2 } from 'lucide-react';
import { SnapCarousel } from '@/components/snap-carousel';
import { type CardColor } from '@/lib/card-colors';
import { isFutureMonth, money, monthLabel, plural, type MonthKey } from '@/lib/format';

export type CarouselCard = {
  id: number; name: string; color: CardColor;
  invoiceAmount: number; movementCount: number;
};

// Wallet-style card picker: see SnapCarousel. Only the face of each card lives here.
export function CardCarousel({ cards, month, selectedId, onSelect, onAdd, onEdit, onDelete, onHistory }: {
  cards: CarouselCard[]; month: MonthKey; selectedId: number | null;
  onSelect: (cardId: number) => void; onAdd: () => void;
  onEdit: (card: CarouselCard) => void; onDelete: (card: CarouselCard) => void; onHistory: () => void;
}) {
  return <SnapCarousel items={cards} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd}
    region="Seus cartões" faceTestId="card-face" itemLabel={(card) => `Cartão ${card.name}`}
    add={{ testId: 'button-add-card', title: 'Adicionar cartão', text: 'Cada cartão tem suas compras e a fatura de cada mês.', ariaLabel: 'Adicionar cartão' }}
    renderFace={(card, active, accent) => <>
          <div className="relative flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono-data text-[10px] uppercase tracking-[.18em] opacity-80" style={{ color: accent }}>Visão do cartão</p><h2 className="mt-2 line-clamp-2 font-display text-2xl leading-tight [overflow-wrap:anywhere]">{card.name}</h2></div>
            <div className={`flex shrink-0 gap-2 ${active ? '' : 'invisible'}`}><button aria-label={`Ver histórico de ${card.name}`} data-testid="button-history" tabIndex={active ? 0 : -1} onClick={onHistory} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"><History size={15}/></button><button aria-label="Editar cartão" data-testid="button-edit-card" tabIndex={active ? 0 : -1} onClick={() => onEdit(card)} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"><FilePenLine size={15}/></button><button aria-label="Remover cartão" data-testid="button-delete-card" tabIndex={active ? 0 : -1} onClick={() => onDelete(card)} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10 hover:text-[#f1b5a5]"><Trash2 size={15}/></button></div></div>
          <div className="relative mt-8 min-w-0"><p className="text-[11px] text-white/70">{isFutureMonth(month) ? 'Fatura prevista de' : 'Fatura de'} {monthLabel(month)}</p><p className="mt-1 font-display text-[clamp(26px,8vw,38px)] leading-tight tracking-[-.03em] [overflow-wrap:anywhere]">{money(card.invoiceAmount)}</p></div>
          <p className="relative mt-4 text-[11px] text-white/70">{card.movementCount === 0 ? 'Nenhuma compra neste mês.' : plural(card.movementCount, 'compra', 'compras')}</p>
    </>}/>;
}
