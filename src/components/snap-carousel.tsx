import { type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { CARD_COLORS, type CardColor } from '@/lib/card-colors';

export type SnapItem = { id: number; color: CardColor };

// Wallet-style picker (Samsung Wallet): one face per slide, snapped to the center,
// neighbours peeking at the edges, an "add" slot at the end. Whatever face settles in
// the middle becomes the selected one. Used by the cards and by the benefits.
export function SnapCarousel<T extends SnapItem>({ items, selectedId, onSelect, onAdd, region, faceTestId, itemLabel, renderFace, add }: {
  items: T[]; selectedId: number | null; onSelect: (id: number) => void; onAdd: () => void;
  region: string; faceTestId: string; itemLabel: (item: T) => string;
  renderFace: (item: T, active: boolean, accent: string) => ReactNode;
  add: { testId: string; title: string; text: string; ariaLabel: string };
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const settled = useRef(false);
  const latest = useRef({ items, selectedId, onSelect });
  latest.current = { items, selectedId, onSelect };
  const index = items.findIndex((item) => item.id === selectedId);

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
  }, [index, items.length]);

  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const settle = () => {
      const { items: current, selectedId: selected, onSelect: select } = latest.current;
      const item = current[nearestIndex()];
      if (item && item.id !== selected) select(item.id);
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
    const next = items[index + step];
    if (!step || !next) return;
    event.preventDefault();
    onSelect(next.id);
  };

  return <div>
    <div ref={scroller} role="region" aria-label={region} tabIndex={0} onKeyDown={onKeyDown}
      className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-[26px] py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#78947e]/50">
      {/* Spacers let the first and last slides reach the center. */}
      <div aria-hidden className="w-[calc(7%-12px)] shrink-0"/>
      {items.map((item, i) => {
        const active = item.id === selectedId;
        const { background, accent } = CARD_COLORS[item.color];
        return <article key={item.id} ref={(el) => { slides.current[i] = el; }} data-testid={`${faceTestId}-${item.id}`} aria-current={active ? 'true' : undefined} aria-label={itemLabel(item)}
          onClick={() => { if (!active) onSelect(item.id); }}
          className={`relative w-[86%] shrink-0 snap-center overflow-hidden rounded-[26px] p-6 text-[#fffaf0] shadow-[0_14px_32px_-24px_rgba(32,70,52,.6)] transition duration-300 sm:p-8 ${active ? 'scale-100 opacity-100' : 'scale-[.94] cursor-pointer opacity-70'}`}
          style={{ background }}>
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"/><div className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-white/10"/>
          {renderFace(item, active, accent)}
        </article>;
      })}
      <button ref={(el) => { slides.current[items.length] = el; }} data-testid={add.testId} onClick={onAdd}
        className="flex w-[86%] shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-[#cfc7b7] bg-[#f8f5ed] p-6 text-[#496754] transition hover:bg-[#f1ede3]">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ece2] text-[#52735c]"><Plus size={22}/></span>
        <span className="font-display text-[22px] text-[#234638]">{add.title}</span>
        <span className="max-w-[220px] text-center text-xs leading-5 text-[#7d887c]">{add.text}</span>
      </button>
      <div aria-hidden className="w-[calc(7%-12px)] shrink-0"/>
    </div>

    <div className="mt-4 flex items-center justify-center gap-2">
      {items.map((item) => {
        const active = item.id === selectedId;
        return <button key={item.id} aria-label={itemLabel(item)} aria-current={active ? 'true' : undefined} onClick={() => onSelect(item.id)}
          className="grid h-6 place-items-center px-0.5"><span className={`block h-2 rounded-full transition-all duration-300 ${active ? 'w-5' : 'w-2 opacity-40'}`} style={{ background: CARD_COLORS[item.color].background }}/></button>;
      })}
      <button aria-label={add.ariaLabel} onClick={() => scrollToIndex(items.length, 'smooth')} className="grid h-6 w-6 place-items-center rounded-full text-[#7d887c] transition hover:bg-[#ece7dc]"><Plus size={13}/></button>
    </div>
  </div>;
}
