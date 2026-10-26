// Tabela de apoio só para leitor de tela (specs/redesign-opcao-d-entradas.md RF-06); os outros gráficos reutilizam.
export function ChartTable({ caption, head = ['Item', 'Valor'], rows }: { caption: string; head?: [string, string]; rows: { label: string; value: string }[] }) {
  return <table className="sr-only">
    <caption>{caption}</caption>
    <thead><tr><th scope="col">{head[0]}</th><th scope="col">{head[1]}</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody>
  </table>;
}
