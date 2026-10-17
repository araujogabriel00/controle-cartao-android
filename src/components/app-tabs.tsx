import { useLocation } from 'wouter';
import { CreditCard, HandCoins } from 'lucide-react';

// RF-01: the two areas of the app. Cards and income never share a screen (D2).
export function AppTabs() {
  const [location, navigate] = useLocation();
  const onIncome = location.startsWith('/entradas');
  const tab = (active: boolean) => `flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${active ? 'bg-[#28513f] text-[#fffaf0]' : 'text-[#546b5d] hover:bg-[#ece7dc]'}`;
  return <nav aria-label="Áreas do app" className="enter mt-4 flex gap-1 rounded-full border border-[#e1dbce] bg-[#fbf8f0] p-1">
    <button data-testid="tab-income" aria-current={onIncome ? 'page' : undefined} onClick={() => navigate('/entradas')} className={tab(onIncome)}><HandCoins size={14}/> Entradas</button>
    <button data-testid="tab-cards" aria-current={!onIncome ? 'page' : undefined} onClick={() => navigate('/')} className={tab(!onIncome)}><CreditCard size={14}/> Cartões</button>
  </nav>;
}
