export function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'peach' | 'gold' }) {
  return <div className="h-[7px] overflow-hidden rounded-full bg-[#e9e4d9]"><div className={`progress-fill h-full rounded-full ${tone === 'peach' ? 'bg-[#d98771]' : tone === 'gold' ? 'bg-[#d5ad58]' : 'bg-[#557e68]'}`} style={{ transform: `scaleX(${Math.max(0, Math.min(value, 100)) / 100})` }} /></div>;
}
