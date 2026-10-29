import { ArrowDownLeft, ArrowUpRight, Bell, CalendarClock, Check } from 'lucide-react';
import { type ForecastOccurrence, type ForecastState } from '@workspace/api-client-react';
import { capitalize, money, monthName } from '@/lib/format';

const NBSP = ' ';

// specs/previsoes.md RF-04, RN-15: o estado nunca depende só de cor; cada etiqueta tem ícone e texto de 14 px.
const STATES: Record<ForecastState, { label: string; icon: typeof Check; className: string }> = {
  'in-balance': { label: 'No saldo', icon: Check, className: 'bg-tint text-brand' },
  reminder: { label: 'Fora do saldo', icon: Bell, className: 'bg-chip text-ink-soft' },
  planned: { label: 'Previsto', icon: CalendarClock, className: 'bg-warn-tint text-eyebrow' },
};

export function ForecastChip({ state }: { state: ForecastState }) {
  const { label, icon: Icon, className } = STATES[state];
  return <span data-testid="chip-forecast-state" className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[14px] font-medium ${className}`}><Icon aria-hidden size={14}/>{label}</span>;
}

export const kindLabel = (kind: 'receive' | 'pay') => (kind === 'receive' ? 'A receber' : 'A pagar');

// "+ R$ 800,00" para receber e "− R$ 119,90" para pagar: o sinal diz o mesmo que a cor.
export const signedAmount = (kind: 'receive' | 'pay', amount: number) => `${kind === 'receive' ? '+' : '−'}${NBSP}${money(amount)}`;

// "+ R$ 3.027,00" / "− R$ 1.500,00" / "R$ 0,00" para uma diferença de saldo.
export const signedDelta = (value: number) => (value > 0 ? `+${NBSP}${money(value)}` : value < 0 ? `−${NBSP}${money(-value)}` : money(value));

// "27/10" e "31/out".
export const shortDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
export const shortDateName = (date: string) => `${date.slice(8, 10)}/${monthName(date.slice(0, 7)).slice(0, 3)}`;

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
// "Terça, 27 de outubro"
export function dayTitle(date: string) {
  const weekday = WEEKDAYS[new Date(`${date}T12:00:00`).getDay()];
  return `${capitalize(weekday)}, ${Number(date.slice(8, 10))} de ${monthName(date.slice(0, 7))}`;
}

// Linha de uma ocorrência: ícone do tipo, descrição, "A receber"/"A pagar" com a etiqueta do estado e o valor com sinal.
export function ForecastRowBody({ item }: { item: ForecastOccurrence }) {
  const Icon = item.kind === 'receive' ? ArrowDownLeft : ArrowUpRight;
  return <>
    <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.kind === 'receive' ? 'bg-tint text-chart-in' : 'bg-alert-tint text-chart-out'}`}><Icon size={18}/></span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[16px] font-semibold text-ink">{item.description}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-soft"><span>{kindLabel(item.kind)}{item.recurring ? ' · todo mês' : ''}</span><ForecastChip state={item.state}/></span>
    </span>
    <span className="shrink-0 font-mono-data text-[16px] text-ink">{signedAmount(item.kind, item.amount)}</span>
  </>;
}
