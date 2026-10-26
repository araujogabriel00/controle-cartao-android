import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { dialogOverlay } from '@/lib/dialog-styles';

const backdrop = (onClose: () => void) => (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

// Folha de rodapé das listas de ações (specs/redesign-opcao-d-telas-de-apoio.md D6): título, conteúdo e "Fechar".
// Fecha ao tocar fora, em "Fechar", com Escape ou quando quem a usa decide fechar ao escolher.
export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return <div className={`${dialogOverlay} flex items-end`} onMouseDown={backdrop(onClose)}>
    <div role="dialog" aria-modal="true" aria-label={title} className="enter mx-auto w-full max-w-[440px] rounded-t-[24px] border border-line bg-surface p-5 pb-6">
      <h2 className="mb-2 truncate font-display text-[22px] text-ink">{title}</h2>
      {children}
      <button type="button" onClick={onClose} className="mt-2 h-12 w-full rounded-full border border-line text-[15px] font-semibold text-ink-soft transition hover:bg-paper">Fechar</button>
    </div>
  </div>;
}

// Moldura dos formulários (D3): a folha sobe do rodapé, rola quando o teclado encolhe a tela, fecha com Escape
// ou ao tocar fora e leva o foco para o primeiro campo de texto.
export function FormSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input:not([type=date]):not([type=month]):not([type=hidden]), select, textarea')?.focus({ preventScroll: true });
  }, []);
  return <div className={dialogOverlay} onMouseDown={backdrop(onClose)}>
    <div ref={ref} className="h-full overflow-y-auto overscroll-contain" onMouseDown={backdrop(onClose)}>
      <div className="flex min-h-full items-end" onMouseDown={backdrop(onClose)}>{children}</div>
    </div>
  </div>;
}

// Cabeçalho comum dos formulários: faixa pequena, título em Fraunces e "Fechar" de 44 px.
export function SheetHeader({ kicker, title, onClose }: { kicker: string; title: string; onClose: () => void }) {
  return <div className="mb-4 flex items-start justify-between gap-3">
    <div className="min-w-0"><span className="font-mono-data text-xs uppercase tracking-[.14em] text-eyebrow">{kicker}</span><h2 className="mt-1 font-display text-[26px] leading-tight text-ink">{title}</h2></div>
    <button type="button" aria-label="Fechar" onClick={onClose} className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-[#eee9df]"><X size={20}/></button>
  </div>;
}

// Erro do formulário (RF-03): dentro da folha, acima dos botões, avisado ao leitor de tela; os botões têm 52 px.
export function FormActions({ busy, isEdit, onClose, error }: { busy: boolean; isEdit: boolean; onClose: () => void; error?: string | null }) {
  return <>
    {error && <p role="alert" data-testid="text-form-error" className="mb-3 rounded-xl bg-[#f5e9e1] px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
    <div className="mt-2 flex gap-3">
      <button type="button" onClick={onClose} className="h-[52px] flex-1 rounded-full border border-line px-4 text-[15px] font-semibold text-ink-soft transition hover:bg-paper">Cancelar</button>
      <button disabled={busy} type="submit" className="h-[52px] flex-1 rounded-full bg-brand px-4 text-[15px] font-semibold text-on-brand transition hover:bg-[#1f4333] disabled:opacity-60">{busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}</button>
    </div>
  </>;
}
