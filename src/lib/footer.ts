// Areas that have the footer (botao-lancar D9): Entradas, Cartões and Benefícios and the screens opened from
// Entradas and Benefícios, never the history or the categories.
export const hasFooter = (location: string) => location === '/' || location.startsWith('/mes/') || location.startsWith('/entradas') || location.startsWith('/beneficios');
