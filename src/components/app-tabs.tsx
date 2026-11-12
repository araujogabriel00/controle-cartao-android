import { useLocation } from 'wouter';
import { CalendarDays, CreditCard, HandCoins, House, type LucideIcon, Utensils } from 'lucide-react';
import { type Area, areaOf, areaPath, monthInPath } from '@/lib/format';

const TABS: { area: Area; label: string; icon: LucideIcon; testId: string }[] = [
  { area: 'home', label: 'Início', icon: House, testId: 'nav-home' },
  { area: 'income', label: 'Entradas', icon: HandCoins, testId: 'tab-income' },
  { area: 'forecasts', label: 'Previsões', icon: CalendarDays, testId: 'tab-forecasts' },
  { area: 'cards', label: 'Cartões', icon: CreditCard, testId: 'tab-cards' },
  { area: 'benefits', label: 'Benefícios', icon: Utensils, testId: 'tab-benefits' },
];

// Barra inferior fixa com as áreas do app (specs/redesign-v2-fundacao.md RF-01, RF-02; specs/barra-inferior-sem-rotulos.md: só ícones, o nome vai em aria-label e title). Trocar de área
// mantém o mês aberto (shared-month D1); tocar na área ativa volta à tela raiz dela.
export function AppTabs() {
  const [location, navigate] = useLocation();
  const active = areaOf(location);
  const month = monthInPath(location);
  return <nav aria-label="Áreas do app" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] backdrop-blur">
    <div className="mx-auto grid h-[72px] max-w-[860px] grid-cols-5">
      {TABS.map(({ area, label, icon: Icon, testId }) => <button key={area} data-testid={testId} aria-label={label} title={label} aria-current={active === area ? 'page' : undefined} onClick={() => navigate(areaPath(area, month))} className="flex min-h-12 min-w-12 items-center justify-center transition">
        <span className={`grid h-8 w-16 place-items-center rounded-full transition ${active === area ? 'bg-tint text-ink' : 'text-ink-soft'}`}><Icon aria-hidden size={24} strokeWidth={active === area ? 2.4 : 2}/></span>
      </button>)}
    </div>
  </nav>;
}
