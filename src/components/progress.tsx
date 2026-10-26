export function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'peach' | 'gold' }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[#e6e1d5]"><div className={`progress-fill h-full rounded-full ${tone === 'peach' ? 'bg-[#d98771]' : tone === 'gold' ? 'bg-[#d5ad58]' : 'bg-brand'}`} style={{ transform: `scaleX(${Math.max(0, Math.min(value, 100)) / 100})` }} /></div>;
}
