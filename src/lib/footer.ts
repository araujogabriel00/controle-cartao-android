import { areaOf } from '@/lib/format';

// Screens that have the bottom bar and the "Lançar" button (botao-lancar D9, redesign-v2-fundacao D1, D4): the areas
// and the screens opened from them, never the history or the categories. The forecast form takes the whole screen
// (previsoes RF-05) and has its own fixed button, so it has neither the bar nor the floating button.
export const hasFooter = (location: string) => areaOf(location) !== null && !location.startsWith('/previsoes/nova') && !location.startsWith('/previsoes/editar');
