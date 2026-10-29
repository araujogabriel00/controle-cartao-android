import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Check } from 'lucide-react';
import { hasFooter } from '@/lib/footer';

export type NoticeState = { text: string; error?: boolean } | null;

const SHOW_MS = 4000;

// Avisos das telas (specs/redesign-opcao-d-telas-de-apoio.md D8): somem em 4 s. Enquanto um formulário está
// aberto (`formOpen`), o erro vai para dentro da folha (`formError`) em vez de virar aviso por trás dela.
export function useNotice(formOpen = false) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const open = useRef(formOpen);
  open.current = formOpen;
  useEffect(() => { if (!formOpen) setFormError(null); }, [formOpen]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback((next: NoticeState) => {
    setNotice(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(null), SHOW_MS);
  }, []);
  const notify = useCallback((text: string) => { setFormError(null); show({ text }); }, [show]);
  // Validation errors from the store are already written for the user.
  const failed = useCallback((error?: Error) => {
    const text = error?.message || 'Não foi possível salvar. Tente novamente.';
    if (open.current) setFormError(text); else show({ text, error: true });
  }, [show]);
  return { notice, notify, failed, formError };
}

// Fica acima do rodapé nas telas que têm rodapé; sucesso é `status`, erro é `alert`.
export function Notice({ notice }: { notice: NoticeState }) {
  const [location] = useLocation();
  if (!notice) return null;
  return <div role={notice.error ? 'alert' : 'status'} data-testid="status-toast" className={`fixed inset-x-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold text-on-brand shadow-lg ${hasFooter(location) ? 'bottom-[calc(6.5rem+env(safe-area-inset-bottom))]' : 'bottom-6'} ${notice.error ? 'bg-alert' : 'bg-brand'}`}>
    <Check size={16} className="shrink-0"/><span className="min-w-0">{notice.text}</span>
  </div>;
}
