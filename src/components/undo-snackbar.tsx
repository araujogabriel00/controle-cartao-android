import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useDiscardUndo, useUndoDeletion } from '@workspace/api-client-react';
import { hasFooter } from '@/lib/footer';

// Aviso "removido. Desfazer" (specs/desfazer-exclusao.md D1, D3, D4): fica 6 s, pausa com o foco ou o dedo/cursor em cima, e
// só existe um por vez. O estado é global e simples para qualquer tela abrir o aviso depois de apagar, e para o `Notice`
// se calar enquanto ele está na tela (RN-05).
type Snack = { key: number; kind: 'undo' | 'info' | 'error'; undoId?: number; label: string; text: string };

const UNDO_MS = 6000;
const INFO_MS = 4000;
const FADE_MS = 150;

let current: Snack | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const set = (next: Snack | null) => { current = next; listeners.forEach((listener) => listener()); };

// D4: a new exclusion replaces the notice of the previous one (which stays final: the store only keeps the last undo).
export function showUndo({ undoId, label, text }: { undoId: number; label: string; text: string }) {
  set({ key: ++seq, kind: 'undo', undoId, label, text });
}

// Atalho das telas: `mutate(vars, undoable('Mercado', 'Mercado removido.'))` abre o aviso depois de apagar (D1).
export const undoable = (label: string, text: string) => ({ onSuccess: (result: { undoId: number }) => showUndo({ undoId: result.undoId, label, text }) });
// RF-07: o aviso diz o alcance escolhido.
export const scopeSuffix = (scope: 'month' | 'forward') => (scope === 'month' ? ' deste mês' : ' deste mês em diante');

export const useUndoActive = () => useSyncExternalStore(subscribe, () => current !== null);

export function UndoSnackbar() {
  const snack = useSyncExternalStore(subscribe, () => current);
  const [location] = useLocation();
  const client = useQueryClient();
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [closing, setClosing] = useState(false);
  const remaining = useRef(0);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const paused = hover || focus;

  const discard = useDiscardUndo();
  const undo = useUndoDeletion({
    mutation: {
      onSuccess: () => { void client.invalidateQueries(); set({ key: ++seq, kind: 'info', label: '', text: `${current?.label ?? ''} de volta.` }); },
      onError: (error) => set({ key: ++seq, kind: 'error', label: '', text: error.message || 'Não foi possível desfazer.' }),
    },
  });

  // RF-04: the time left is kept while paused. The reset runs before the timer effect, so each notice starts whole.
  useEffect(() => {
    setClosing(false);
    setHover(false);
    setFocus(false);
    remaining.current = snack?.kind === 'undo' ? UNDO_MS : INFO_MS;
  }, [snack?.key, snack?.kind]);

  const close = useCallback(() => {
    const ending = current;
    setClosing(true);
    window.setTimeout(() => { if (current === ending) set(null); }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!snack || paused || closing || undo.isPending) return;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(() => {
      if (snack.kind === 'undo' && snack.undoId !== undefined) discard.mutate({ undoId: snack.undoId });
      close();
    }, remaining.current);
    return () => { window.clearTimeout(timer.current); remaining.current -= Date.now() - startedAt.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snack?.key, paused, closing, undo.isPending]);

  if (!snack) return null;
  const bottom = hasFooter(location) ? 'bottom-[calc(10.5rem+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]' : 'bottom-[calc(1.5rem+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))]';
  return <div
    role={snack.kind === 'error' ? 'alert' : 'status'} data-testid="snackbar-undo"
    onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
    className={`fade-in fixed inset-x-4 z-[60] mx-auto flex min-h-14 max-w-[440px] items-center gap-3 rounded-[28px] bg-ink py-1 pl-5 pr-2 text-[14px] leading-5 text-paper shadow-lg transition-opacity duration-150 ${closing ? 'opacity-0' : 'opacity-100'} ${bottom}`}>
    <span data-testid="text-undo" className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{snack.text}</span>
    {snack.kind === 'undo' && snack.undoId !== undefined && <button type="button" data-testid="button-undo" disabled={undo.isPending}
      onClick={() => undo.mutate({ undoId: snack.undoId! })}
      className="h-12 shrink-0 rounded-full px-4 text-[15px] font-semibold text-snack-action transition hover:bg-paper/10 disabled:opacity-60">Desfazer</button>}
  </div>;
}
