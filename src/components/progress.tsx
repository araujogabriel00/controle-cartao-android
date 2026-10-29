export function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'peach' | 'gold' }) {
  return <div className="h-2 overflow-hidden rounded-full bg-chart-track"><div className={`progress-fill h-full rounded-full ${tone === 'peach' ? 'bg-chart-out' : tone === 'gold' ? 'bg-gold' : 'bg-brand'}`} style={{ transform: `scaleX(${Math.max(0, Math.min(value, 100)) / 100})` }} /></div>;
}
