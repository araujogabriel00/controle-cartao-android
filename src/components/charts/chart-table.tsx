// Tabela de apoio só para leitor de tela (specs/redesign-opcao-d-entradas.md RF-06); os outros gráficos reutilizam.
export function ChartTable({ caption, head = ['Item', 'Valor'], rows }: { caption: string; head?: [string, string]; rows: { label: string; value: string }[] }) {
  // O sr-only fica no contêiner: numa <table> o width de 1px é ignorado e ela alargava a página (scroll horizontal).
  return <div className="sr-only"><table>
    <caption>{caption}</caption>
    <thead><tr><th scope="col">{head[0]}</th><th scope="col">{head[1]}</th></tr></thead>
    <tbody>{rows.map((row, index) => <tr key={`${index}-${row.label}`}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody>
  </table></div>;
}
