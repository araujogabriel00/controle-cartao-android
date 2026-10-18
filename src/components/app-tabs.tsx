import { useLocation } from 'wouter';
import { CreditCard, HandCoins, Utensils } from 'lucide-react';
import { type Area, areaPath, monthInPath } from '@/lib/format';

// RF-01: the areas of the app, in this order. Cards, income and benefits never share a screen.
// Changing the area keeps the open month (shared-month D1); screens with no month (history,
// categories) open the current one.
export function AppTabs() {
  const [location, navigate] = useLocation();
  const area: Area = location.startsWith('/entradas') ? 'income' : location.startsWith('/beneficios') ? 'benefits' : 'cards';
  const month = monthInPath(location);
  // Three tabs must fit a 360 px phone without widening the page: the icons only
  // show from 400 px up, and min-w-0 + truncate keep a long label from pushing.
  const tab = (active: boolean) => `flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold transition ${active ? 'bg-[#28513f] text-[#fffaf0]' : 'text-[#546b5d] hover:bg-[#ece7dc]'}`;
  const icon = 'hidden shrink-0 min-[400px]:block';
  return <nav aria-label="Áreas do app" className="enter mt-4 flex gap-1 overflow-hidden rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1">
    <button data-testid="tab-income" aria-current={area === 'income' ? 'page' : undefined} onClick={() => navigate(areaPath('income', month))} className={tab(area === 'income')}><HandCoins size={14} className={icon}/><span className="truncate">Entradas</span></button>
    <button data-testid="tab-cards" aria-current={area === 'cards' ? 'page' : undefined} onClick={() => navigate(areaPath('cards', month))} className={tab(area === 'cards')}><CreditCard size={14} className={icon}/><span className="truncate">Cartões</span></button>
    <button data-testid="tab-benefits" aria-current={area === 'benefits' ? 'page' : undefined} onClick={() => navigate(areaPath('benefits', month))} className={tab(area === 'benefits')}><Utensils size={14} className={icon}/><span className="truncate">Benefícios</span></button>
  </nav>;
}
