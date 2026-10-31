import { ArrowLeft } from 'lucide-react';

// Botão de voltar de 44 px no topo das telas secundárias (specs/redesign-opcao-d-telas-de-apoio.md D1).
export function BackButton({ onClick, label = 'Voltar', tall = false }: { onClick: () => void; label?: string; tall?: boolean }) {
  return <button data-testid="button-back" aria-label={label} onClick={onClick} className={`-ml-2 flex ${tall ? 'h-12' : 'h-11'} items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-brand transition hover:bg-hover`}><ArrowLeft size={20}/>{label}</button>;
}
