import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { dialogOverlay } from '@/lib/dialog-styles';

export type ConfirmOptions = { title: string; text?: string; confirmLabel?: string };
type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm>(async () => false);

// Pergunta antes de apagar ou fechar algo (specs/redesign-opcao-d-telas-de-apoio.md D5): título, o que acontece,
// "Cancelar" (foco inicial) e o botão destrutivo, ambos de 48 px. `const confirm = useConfirm(); if (await confirm({...}))`.
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<{ options: ConfirmOptions; resolve: (answer: boolean) => void } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirm = useCallback<Confirm>((options) => new Promise((resolve) => setAsk({ options, resolve })), []);
  const answer = (value: boolean) => { ask?.resolve(value); setAsk(null); };

  useEffect(() => {
    if (!ask) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { ask.resolve(false); setAsk(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask]);

  return <ConfirmContext.Provider value={confirm}>
    {children}
    {ask && <div className={`${dialogOverlay} z-[70] flex items-center justify-center p-4`} onMouseDown={(event) => { if (event.target === event.currentTarget) answer(false); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={ask.options.text ? 'confirm-text' : undefined} className="enter w-full max-w-[400px] rounded-[24px] border border-line bg-surface p-6">
        <h2 id="confirm-title" className="font-display text-[24px] leading-tight text-ink">{ask.options.title}</h2>
        {ask.options.text && <p id="confirm-text" data-testid="text-confirm" className="mt-2 text-[15px] leading-6 text-ink-soft">{ask.options.text}</p>}
        <div className="mt-6 flex gap-3">
          <button ref={cancelRef} type="button" data-testid="button-confirm-cancel" onClick={() => answer(false)} className="h-12 flex-1 rounded-full border border-line text-[15px] font-semibold text-ink transition hover:bg-paper">Cancelar</button>
          <button type="button" data-testid="button-confirm-ok" onClick={() => answer(true)} className="h-12 flex-1 rounded-full bg-alert text-[15px] font-semibold text-on-brand transition hover:brightness-95">{ask.options.confirmLabel ?? 'Remover'}</button>
        </div>
      </div>
    </div>}
  </ConfirmContext.Provider>;
}

// "Remover ‹o quê›?" com a frase de sempre sobre desfazer.
export const removeAsk = (what: string, extra = ''): ConfirmOptions => ({ title: `Remover ${what}?`, text: `${extra ? `${extra} ` : ''}Esta ação não pode ser desfeita.`, confirmLabel: 'Remover' });
