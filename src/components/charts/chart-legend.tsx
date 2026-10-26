// Legenda com quadrados de 12 px e texto de 13 px. `swatch` é uma classe de cor de fundo (ex.: "bg-chart-in").
export function ChartLegend({ items }: { items: { label: string; swatch: string }[] }) {
  return <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
    {items.map((item) => <li key={item.label} className="flex items-center gap-1.5"><span aria-hidden className={`h-3 w-3 rounded-[2px] ${item.swatch}`}/>{item.label}</li>)}
  </ul>;
}
