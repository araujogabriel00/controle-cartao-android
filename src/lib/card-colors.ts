// Fixed palette for card faces. Every background is dark enough for the light
// text the face uses; the accent colors the amounts and the progress bar.

export const CARD_COLOR_KEYS = ['verde', 'azul', 'roxo', 'vinho', 'grafite', 'terracota'] as const;
export type CardColor = (typeof CARD_COLOR_KEYS)[number];

export const CARD_COLORS: Record<CardColor, { label: string; background: string; accent: string }> = {
  verde: { label: 'Verde', background: '#28513f', accent: '#f0d28b' },
  azul: { label: 'Azul', background: '#22476b', accent: '#9cc7ef' },
  roxo: { label: 'Roxo', background: '#47386b', accent: '#d2c2f2' },
  vinho: { label: 'Vinho', background: '#6a2c39', accent: '#f2b8b0' },
  grafite: { label: 'Grafite', background: '#30363b', accent: '#d9dcd6' },
  terracota: { label: 'Terracota', background: '#8a4a31', accent: '#f6cf9a' },
};

export const isCardColor = (value: unknown): value is CardColor =>
  typeof value === 'string' && (CARD_COLOR_KEYS as readonly string[]).includes(value);
