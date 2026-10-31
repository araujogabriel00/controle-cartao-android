import { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, Eye, EyeOff, History, type LucideIcon, MoreHorizontal, Moon, ShoppingCart, Smartphone, Sparkles, Sun, Tag } from 'lucide-react';
import { useGetCart } from '@workspace/api-client-react';
import { BottomSheet } from '@/components/bottom-sheet';
import { MonthNav } from '@/components/month-nav';
import { type Area, type MonthKey } from '@/lib/format';
import { toggleHideValues, useHideValues } from '@/lib/hide-values';
import { chooseTheme, type Theme, useTheme } from '@/lib/theme';

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'auto', label: 'Auto', icon: Smartphone },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
];

// Cabeçalho único das telas de área (specs/redesign-v2-fundacao.md D6, RF-07): olho, mês e "⋯". O mês é o
// compartilhado entre as áreas; o "⋯" leva a Categorias, Histórico e Aparência (D5, D7).
export function AppHeader({ area, month, canGoPrevious, canGoNext }: { area: Area; month: MonthKey; canGoPrevious?: boolean; canGoNext?: boolean }) {
  const [, navigate] = useLocation();
  const hidden = useHideValues();
  const cartCount = useGetCart().data?.itemCount ?? 0;
  const theme = useTheme();
  const [menu, setMenu] = useState(false);
  const iconButton = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:bg-hover';
  const item = 'flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left text-[15px] font-semibold text-ink transition hover:bg-hover';
  const go = (path: string) => { setMenu(false); navigate(path); };
  return <>
    <header className="enter mt-4 flex items-center gap-2">
      <button data-testid="button-hide-values" aria-label={hidden ? 'Mostrar valores' : 'Esconder valores'} aria-pressed={hidden} onClick={toggleHideValues} className={iconButton}>{hidden ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
      <MonthNav area={area} month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>
      <button data-testid="button-header-menu" aria-label="Mais opções" aria-haspopup="dialog" onClick={() => setMenu(true)} className={iconButton}><MoreHorizontal size={20}/></button>
    </header>
    {menu && <BottomSheet title="Mais opções" onClose={() => setMenu(false)}>
      <div className="space-y-2">
        <button data-testid="menu-cart" onClick={() => go('/carrinho')} className={item}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand"><ShoppingCart size={18}/></span><span className="min-w-0 flex-1">Carrinho</span>{cartCount > 0 && <span data-testid="text-menu-cart-count" className="shrink-0 rounded-full bg-tint px-2.5 py-0.5 font-mono-data text-[14px] text-brand">{cartCount}</span>}</button>
        <button data-testid="menu-dreams" onClick={() => go('/sonhos')} className={item}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Sparkles size={18}/></span>Sonhos</button>
        <button data-testid="menu-categories" onClick={() => go('/categorias')} className={item}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand"><Tag size={18}/></span>Categorias</button>
        <button data-testid="menu-history" onClick={() => go('/historico')} className={item}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-brand"><History size={18}/></span>Histórico</button>
        <div data-testid="menu-appearance" role="radiogroup" aria-label="Aparência" className="rounded-2xl border border-line bg-paper px-4 py-3">
          <p className="mb-2 text-[15px] font-semibold text-ink">Aparência</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="radio" aria-checked={theme === value} data-testid={`theme-${value}`} onClick={() => chooseTheme(value)} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-2 text-[14px] font-semibold transition ${theme === value ? 'border-brand bg-tint text-brand' : 'border-line bg-surface text-ink-soft hover:bg-hover'}`}>{theme === value ? <Check size={16}/> : <Icon size={16}/>}{label}</button>)}
          </div>
        </div>
      </div>
    </BottomSheet>}
  </>;
}
