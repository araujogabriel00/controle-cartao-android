import { type KeyboardEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { FilePenLine, Plus, Trash2 } from 'lucide-react';
import { CARD_COLORS, type CardColor } from '@/lib/card-colors';
import { money } from '@/lib/format';

export type CarouselCard = {
  id: number; name: string; color: CardColor;
  limitAmount: number; usedAmount: number; availableAmount: number; percentUsed: number;
};

// Wallet-style card picker (Samsung Wallet): one card face per slide, snapped
// to the center, neighbours peeking at the edges, an "add card" slot at the end.
// Whatever card settles in the middle becomes the selected one.
export function CardCarousel({ cards, selectedId, onSelect, onAdd, onEdit, onDelete }: {
  cards: CarouselCard[]; selectedId: number | null;
  onSelect: (cardId: number) => void; onAdd: () => void;
  onEdit: (card: CarouselCard) => void; onDelete: (card: CarouselCard) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const settled = useRef(false);
  const latest = useRef({ cards, selectedId, onSelect });
  latest.current = { cards, selectedId, onSelect };
  const index = cards.findIndex((card) => card.id === selectedId);

  // Slide whose center is closest to the scroller's center (the "add" slot included).
  const nearestIndex = () => {
    const box = scroller.current;
    if (!box) return -1;
    const center = box.scrollLeft + box.clientWidth / 2;
    let best = -1;
    let bestDistance = Infinity;
    slides.current.forEach((slide, i) => {
      if (!slide) return;
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (distance < bestDistance) { best = i; bestDistance = distance; }
    });
    return best;
  };

  const scrollToIndex = (i: number, behavior: ScrollBehavior) => {
    const box = scroller.current;
    const slide = slides.current[i];
    if (box && slide) box.scrollTo({ left: slide.offsetLeft - (box.clientWidth - slide.offsetWidth) / 2, behavior });
  };

  // Opens on the saved card without animation; later changes made elsewhere
  // (dots, keyboard, a new or removed card) glide to it.
  useLayoutEffect(() => {
    if (index < 0) return;
    if (!settled.current) { scrollToIndex(index, 'auto'); settled.current = true; return; }
    if (nearestIndex() !== index) scrollToIndex(index, 'smooth');
  }, [index, cards.length]);

  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const settle = () => {
      const { cards: current, selectedId: selected, onSelect: select } = latest.current;
      const card = current[nearestIndex()];
      if (card && card.id !== selected) select(card.id);
    };
    if ('onscrollend' in window) {
      box.addEventListener('scrollend', settle);
      return () => box.removeEventListener('scrollend', settle);
    }
    let timer = 0;
    const debounced = () => { window.clearTimeout(timer); timer = window.setTimeout(settle, 120); };
    box.addEventListener('scroll', debounced, { passive: true });
    return () => { window.clearTimeout(timer); box.removeEventListener('scroll', debounced); };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const next = cards[index + step];
    if (!step || !next) return;
    event.preventDefault();
    onSelect(next.id);
  };

  return <div>
    <div ref={scroller} role="region" aria-label="Seus cartões" tabIndex={0} onKeyDown={onKeyDown}
      className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-[26px] py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#78947e]/50">
      {/* Spacers let the first and last slides reach the center. */}
      <div aria-hidden className="w-[calc(7%-12px)] shrink-0"/>
      {cards.map((card, i) => {
        const active = card.id === selectedId;
        const { background, accent } = CARD_COLORS[card.color];
        return <article key={card.id} ref={(el) => { slides.current[i] = el; }} data-testid={`card-face-${card.id}`} aria-current={active ? 'true' : undefined} aria-label={`Cartão ${card.name}`}
          onClick={() => { if (!active) onSelect(card.id); }}
          className={`relative w-[86%] shrink-0 snap-center overflow-hidden rounded-[26px] p-6 text-[#fffaf0] shadow-[0_14px_32px_-24px_rgba(32,70,52,.6)] transition duration-300 sm:p-8 ${active ? 'scale-100 opacity-100' : 'scale-[.94] cursor-pointer opacity-70'}`}
          style={{ background }}>
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"/><div className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-white/10"/>
          <div className="relative flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono-data text-[10px] uppercase tracking-[.18em] opacity-80" style={{ color: accent }}>Visão do cartão</p><h2 className="mt-2 line-clamp-2 font-display text-2xl leading-tight [overflow-wrap:anywhere]">{card.name}</h2></div>
            <div className={`flex shrink-0 gap-2 ${active ? '' : 'invisible'}`}><button aria-label="Editar cartão" data-testid="button-edit-card" tabIndex={active ? 0 : -1} onClick={() => onEdit(card)} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"><FilePenLine size={15}/></button><button aria-label="Remover cartão" data-testid="button-delete-card" tabIndex={active ? 0 : -1} onClick={() => onDelete(card)} className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10 hover:text-[#f1b5a5]"><Trash2 size={15}/></button></div></div>
          <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="min-w-0"><p className="text-[11px] text-white/70">Disponível para usar</p><p className="mt-1 font-display text-[clamp(26px,8vw,38px)] leading-tight tracking-[-.03em] [overflow-wrap:anywhere]">{money(card.availableAmount)}</p></div><div className="min-w-0 border-t border-white/15 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><p className="text-[11px] text-white/70">Usado no mês</p><p className="mt-2 font-mono-data text-[20px] [overflow-wrap:anywhere]" style={{ color: accent }}>{money(card.usedAmount)}</p></div></div>
          <div className="relative mt-7"><div className="mb-2 flex justify-between text-[10px] text-white/70"><span>Limite utilizado</span><span className="font-mono-data" style={{ color: accent }}>{Number(card.percentUsed).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="progress-fill h-full rounded-full" style={{ background: accent, transform: `scaleX(${Math.min(100, Math.max(0, card.percentUsed)) / 100})` }}/></div><p className="mt-2 text-right text-[10px] text-white/70">de {money(card.limitAmount)}</p></div>
          {card.usedAmount === 0 && <p className="relative mt-4 text-[11px] text-white/70">Seu primeiro gasto ainda está por vir. Tudo começa com um registro.</p>}
        </article>;
      })}
      <button ref={(el) => { slides.current[cards.length] = el; }} data-testid="button-add-card" onClick={onAdd}
        className="flex w-[86%] shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-[#cfc7b7] bg-[#f8f5ed] p-6 text-[#496754] transition hover:bg-[#f1ede3]">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ece2] text-[#52735c]"><Plus size={22}/></span>
        <span className="font-display text-[22px] text-[#234638]">Adicionar cartão</span>
        <span className="max-w-[220px] text-center text-xs leading-5 text-[#7d887c]">Cada cartão tem seu limite, suas categorias e seus lançamentos.</span>
      </button>
      <div aria-hidden className="w-[calc(7%-12px)] shrink-0"/>
    </div>

    <div className="mt-4 flex items-center justify-center gap-2">
      {cards.map((card) => {
        const active = card.id === selectedId;
        return <button key={card.id} aria-label={`Cartão ${card.name}`} aria-current={active ? 'true' : undefined} onClick={() => onSelect(card.id)}
          className="grid h-6 place-items-center px-0.5"><span className={`block h-2 rounded-full transition-all duration-300 ${active ? 'w-5' : 'w-2 opacity-40'}`} style={{ background: CARD_COLORS[card.color].background }}/></button>;
      })}
      <button aria-label="Adicionar cartão" onClick={() => scrollToIndex(cards.length, 'smooth')} className="grid h-6 w-6 place-items-center rounded-full text-[#7d887c] transition hover:bg-[#ece7dc]"><Plus size={13}/></button>
    </div>
  </div>;
}
