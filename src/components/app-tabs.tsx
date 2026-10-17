import { useLocation } from 'wouter';
import { CreditCard, HandCoins, Utensils } from 'lucide-react';

// RF-01: the areas of the app, in this order. Cards, income and benefits never share a screen.
export function AppTabs() {
  const [location, navigate] = useLocation();
  const area = location.startsWith('/entradas') ? 'income' : location.startsWith('/beneficios') ? 'benefits' : 'cards';
  const tab = (active: boolean) => `flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${active ? 'bg-[#28513f] text-[#fffaf0]' : 'text-[#546b5d] hover:bg-[#ece7dc]'}`;
  return <nav aria-label="Áreas do app" className="enter mt-4 flex gap-1 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1">
    <button data-testid="tab-income" aria-current={area === 'income' ? 'page' : undefined} onClick={() => navigate('/entradas')} className={tab(area === 'income')}><HandCoins size={14}/> Entradas</button>
    <button data-testid="tab-cards" aria-current={area === 'cards' ? 'page' : undefined} onClick={() => navigate('/')} className={tab(area === 'cards')}><CreditCard size={14}/> Cartões</button>
    <button data-testid="tab-benefits" aria-current={area === 'benefits' ? 'page' : undefined} onClick={() => navigate('/beneficios')} className={tab(area === 'benefits')}><Utensils size={14}/> Benefícios</button>
  </nav>;
}
