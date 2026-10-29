import { areaOf } from '@/lib/format';

// Screens that have the bottom bar and the "Lançar" button (botao-lancar D9, redesign-v2-fundacao D1, D4): the four
// areas and the screens opened from them, never the history or the categories.
export const hasFooter = (location: string) => areaOf(location) !== null;
