import { type ReactNode } from 'react';
import { useLocation } from 'wouter';
import {
  getGetBenefitsQueryKey, getGetCardsQueryKey, getGetDreamPlanQueryKey, getGetDreamsQueryKey, getGetIncomeRangeQueryKey, getGetMonthCashQueryKey,
  useGetBalanceSeries, useGetBenefits, useGetCards, useGetCart, useGetDreamPlan, useGetDreams, useGetForecastAlerts, useGetIncomeRange, useGetInvoiceSeries, useGetMonthCash, useGetRecentSpends,
} from '@workspace/api-client-react';
import { CalendarCheck, ChevronRight, CircleHelp, CreditCard, HandCoins, Plus, ShoppingCart, Utensils } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { shortDate, signedAmount } from '@/components/forecast-parts';
import { openQuickAdd } from '@/components/quick-add';
import { HiddenChart } from '@/components/charts/chart-table';
import { MiniColumns } from '@/components/charts/mini-columns';
import { Sparkline } from '@/components/charts/sparkline';
import { UsageBar } from '@/components/charts/usage-bar';
import { saveForecastAck, useForecastAck } from '@/lib/forecast-ack';
import { type Area, areaPath, dateLabel, forecastDayPath, today, money, monthLabel, monthName, plural, summaryPath, type MonthKey } from '@/lib/format';
import { isHidden } from '@/lib/hide-values';
import { useRememberMonth } from '@/lib/last-month';

// specs/redesign-v2-fundacao.md RF-04 e specs/inicio-com-minigraficos.md: o Início só lê o que as áreas já leem (RN-02) e
// cada painel abre a área correspondente no mês aberto. Sem nada cadastrado, mostra os 3 passos do primeiro uso.
const NBSP = ' ';
const BALANCE_MONTHS = 6;
const INVOICE_MONTHS = 7;
const RECENT_LIMIT = 3;
const DREAM_LIMIT = 3;

// "+ R$ 4.649,50" / "− R$ 520,00": o sinal diz o mesmo que a cor (RN-07).
const signed = (value: number) => value > 0 ? `+${NBSP}${money(value)}` : value < 0 ? `−${NBSP}${money(-value)}` : money(value);

// D1, RF-05: o painel é um alvo só. O botão cobre o painel inteiro e o conteúdo fica ao lado dele, no leitor de tela, para o
// gráfico e a tabela de apoio (RF-08) continuarem alcançáveis: os filhos de um <button> não são lidos como estrutura.
function Panel({ testId, dot, title, label, onOpen, delay, children }: {
  testId: string; dot: string; title: string; label: string; onOpen: () => void; delay: string; children: ReactNode;
}) {
  return <section data-testid={testId} aria-label={title} style={{ animationDelay: delay }} className="enter relative min-h-[120px] rounded-[20px] border border-line bg-surface p-4 transition hover:bg-hover">
    <div className="flex items-center justify-between gap-2 text-[14px]">
      <span className="flex items-center gap-2 font-semibold text-ink"><span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`}/>{title}</span>
      <span aria-hidden className="flex items-center text-ink-soft">Abrir<ChevronRight size={16}/></span>
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">{children}</div>
    <button type="button" aria-label={label} onClick={onOpen} className="absolute inset-0 rounded-[20px]"/>
  </section>;
}

// 30 px só cabe ao lado do gráfico de 128 px em telas largas; abaixo disso o valor encolhe em vez de quebrar no meio.
const value = 'block font-display text-[22px] leading-[1.1] tracking-[-.02em] [overflow-wrap:anywhere] min-[420px]:text-[26px] min-[480px]:text-[30px]';

export default function Inicio({ month }: { month: MonthKey }) {
  const [, navigate] = useLocation();
  useRememberMonth(month);
  const cashQuery = useGetMonthCash(month, { query: { queryKey: getGetMonthCashQueryKey(month), refetchOnWindowFocus: true } });
  const cardsQuery = useGetCards(month, { query: { queryKey: getGetCardsQueryKey(month) } });
  const benefitsQuery = useGetBenefits(month, { query: { queryKey: getGetBenefitsQueryKey(month) } });
  // Sonhos RN-17: uma leitura que falha só derruba o painel de Sonhos, não o resto do Início.
  const dreamsQuery = useGetDreams({ query: { queryKey: getGetDreamsQueryKey() } });
  const planQuery = useGetDreamPlan({ query: { queryKey: getGetDreamPlanQueryKey() } });
  // Carrinho RN-17: uma leitura que falha só esconde a barra.
  const cartQuery = useGetCart();
  const cart = cartQuery.data;
  const cartBar = (cart?.productCount ?? 0) > 0;
  const activeDreams = (dreamsQuery.data?.items ?? []).filter((dream) => dream.status === 'active');
  const balanceSeries = useGetBalanceSeries(month, BALANCE_MONTHS);
  const invoiceSeries = useGetInvoiceSeries(month, INVOICE_MONTHS);
  const recent = useGetRecentSpends(month, RECENT_LIMIT);
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } }).data;
  // D12, RN-11: as previsões que entraram no saldo desde o último "Está certo"; uma leitura que falha só esconde o aviso.
  const ack = useForecastAck();
  const alerts = useGetForecastAlerts(ack).data ?? [];
  const canGoPrevious = !range || month > range.first;
  const canGoNext = !range || month < range.last;
  const go = (area: Exclude<Area, 'home'>) => navigate(areaPath(area, month));

  const cash = cashQuery.data;
  const cards = cardsQuery.data?.cards ?? [];
  const benefits = benefitsQuery.data?.items ?? [];
  const failed = cashQuery.isError || cardsQuery.isError || benefitsQuery.isError;
  const loading = !cash || !cardsQuery.data || !benefitsQuery.data;
  const spent = (cash?.billsAmount ?? 0) + (cash?.dailyAmount ?? 0) + (cash?.cardsAmount ?? 0);
  const empty = Boolean(cash) && cards.length === 0 && benefits.length === 0 && (cash?.incomeAmount ?? 0) === 0 && spent === 0 && (cash?.previousAmount ?? 0) === 0;
  const negative = (cash?.balanceAmount ?? 0) < 0;

  // D5: gasto sobre o disponível do mês (valor do mês + o que veio do anterior), de todos os benefícios.
  const benefitSpent = benefits.reduce((total, item) => total + item.spentAmount, 0);
  const benefitTotal = benefits.reduce((total, item) => total + item.amount + item.carriedAmount, 0);
  const benefitAvailable = benefitsQuery.data?.totalAvailable ?? 0;
  const usedPercent = benefitTotal > 0 ? Math.round((benefitSpent / benefitTotal) * 100) : 0;

  const steps = [
    { title: 'Cadastre um cartão', text: 'Para lançar as compras e ver a fatura.', action: () => go('cards') },
    { title: 'Registre uma entrada', text: 'Salário, renda extra ou qualquer dinheiro que entrou.', action: () => openQuickAdd('income') },
    { title: 'Veja o saldo', text: 'O Início mostra quanto sobra no mês.', action: null },
  ];

  // D9, RN-08: um painel sem gráfico mostra o motivo no lugar dele; a falha da leitura só derruba o gráfico do painel.
  const note = (text: string) => <p data-testid="text-chart-note" className="w-[128px] shrink-0 text-right text-[13px] leading-snug text-ink-soft">{text}</p>;
  const balancePoints = balanceSeries.data ?? [];
  const balanceChart = balanceSeries.isError ? note('Gráfico indisponível')
    : balanceSeries.isLoading ? <div aria-busy="true" className="h-14 w-[128px] shrink-0 animate-pulse rounded-lg bg-line"/>
    : balancePoints.length < 2 ? note('Ainda sem histórico')
    : <Sparkline points={balancePoints.map((p) => ({ month: p.month, value: p.balanceAmount }))} legend="últimos 6 meses"
        caption="Saldo ao fim de cada mês"
        ariaLabel={`Saldo ao fim de cada mês, de ${monthLabel(balancePoints[0].month)} a ${monthLabel(balancePoints[balancePoints.length - 1].month)}: de ${money(balancePoints[0].balanceAmount)} para ${money(balancePoints[balancePoints.length - 1].balanceAmount)}`}/>;

  const invoicePoints = invoiceSeries.data ?? [];
  const hasInvoices = invoicePoints.some((p) => p.invoiceAmount > 0);
  const invoiceChart = invoiceSeries.isError ? note('Gráfico indisponível')
    : invoiceSeries.isLoading ? <div aria-busy="true" className="h-14 w-[128px] shrink-0 animate-pulse rounded-lg bg-line"/>
    : !hasInvoices ? null
    : <MiniColumns columns={invoicePoints.map((p) => ({ month: p.month, value: p.invoiceAmount }))} legend="próximas 7 faturas"
        caption="Faturas dos próximos 7 meses"
        ariaLabel={`Faturas dos próximos ${INVOICE_MONTHS} meses, a partir de ${monthLabel(invoicePoints[0].month)}: ${money(invoicePoints[0].invoiceAmount)} no mês aberto`}/>;

  const recentItems = recent.data ?? [];

  return <main className="notebook-grain min-h-safe bg-paper text-ink">
    <div className={`relative z-10 mx-auto max-w-[860px] px-4 pt-5 sm:px-8 ${cartBar ? 'pb-44' : 'pb-12'}`}>
      <AppHeader area="home" month={month} canGoPrevious={canGoPrevious} canGoNext={canGoNext}/>

      {/* D12, RF-10: nada entra no saldo sem a pessoa saber. "Revisar" abre o dia; "Está certo" dispensa até entrar outra previsão. */}
      {alerts.length > 0 && <section data-testid="card-home-forecast-alert" role="status" aria-label="Previsões que entraram no saldo" className="enter mt-4 rounded-2xl border-2 border-brand bg-surface p-4">
        <p className="flex items-center gap-2 text-[16px] font-semibold text-ink"><CalendarCheck aria-hidden size={18} className="shrink-0 text-brand"/>{alerts.every((item) => item.date === today()) ? (alerts.length === 1 ? 'Hoje entrou 1 previsão no saldo' : `Hoje entraram ${alerts.length} previsões no saldo`) : `${alerts.length === 1 ? 'Entrou 1 previsão' : `Entraram ${alerts.length} previsões`} no saldo desde ${shortDate(alerts[0].date)}`}</p>
        <ul className="mt-2 divide-y divide-line">
          {alerts.map((item) => <li key={`${item.forecastId}-${item.month}`} className="flex items-center justify-between gap-3 py-2 text-[15px]"><span className="min-w-0 truncate text-ink">{item.description}</span><span className="shrink-0 font-mono-data text-ink">{signedAmount(item.kind, item.amount)}</span></li>)}
        </ul>
        <div className="mt-3 flex gap-2">
          <button data-testid="button-review" onClick={() => navigate(forecastDayPath(alerts[alerts.length - 1].date))} className="h-12 flex-1 rounded-full bg-brand text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Revisar</button>
          <button data-testid="button-ack" onClick={() => saveForecastAck(today())} className="h-12 flex-1 rounded-full border border-line text-[15px] font-semibold text-ink-soft transition hover:bg-hover">Está certo</button>
        </div>
      </section>}

      {failed ? <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-9 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-brand"><CircleHelp size={18}/></div><h2 className="mt-3 font-display text-xl text-ink">Não deu para carregar o Início</h2><p className="mt-1 text-[14px] text-ink-soft">Seus dados continuam salvos. Tente de novo.</p><button onClick={() => { void cashQuery.refetch(); void cardsQuery.refetch(); void benefitsQuery.refetch(); }} className="mt-4 h-12 rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition hover:bg-brand-hover">Tentar de novo</button></div>
        : loading || !cash ? <div aria-busy="true" className="mt-6 space-y-3"><div className="h-[132px] animate-pulse rounded-2xl bg-line"/><div className="h-[132px] animate-pulse rounded-2xl bg-line"/><div className="h-[132px] animate-pulse rounded-2xl bg-line"/></div>
        : empty ? <section data-testid="section-first-use" aria-label="Primeiros passos" className="enter mt-6">
          <h1 className="font-display text-[28px] leading-tight text-ink">Lance sua primeira entrada</h1>
          <p className="mt-1 text-[15px] text-ink-soft">Em três passos o app já mostra para onde vai o seu dinheiro.</p>
          <button data-testid="button-first-income" onClick={() => openQuickAdd('income')} className="mt-4 flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-on-brand transition hover:bg-brand-hover"><Plus size={22} strokeWidth={2.2}/>Lançar entrada</button>
          <ol className="mt-6 space-y-2">
            {steps.map((step, index) => {
              const body = <><span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint font-display text-[18px] text-brand">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{step.title}</span><span className="block text-[14px] text-ink-soft">{step.text}</span></span>{step.action && <ChevronRight size={18} className="shrink-0 text-ink-soft"/>}</>;
              return <li key={step.title}>{step.action
                ? <button data-testid={`step-${index + 1}`} onClick={step.action} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:bg-hover">{body}</button>
                : <div data-testid={`step-${index + 1}`} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">{body}</div>}</li>;
            })}
          </ol>
        </section>
        : <div className="mt-6 space-y-3">
          {/* RF-02: saldo do mês, resultado do mês e a linha dos últimos 6 meses; abre Entradas. */}
          <Panel testId="card-home-balance" dot="bg-chart-in" title="Saldo" label={`Abrir Entradas, saldo ${money(cash.balanceAmount)}`} onOpen={() => go('income')} delay="0s">
            <div className="min-w-0">
              <span data-testid="text-home-balance" className={`${value} ${negative ? 'text-alert' : 'text-ink'}`}>{money(cash.balanceAmount)}</span>
              {negative && <span className="mt-1 block text-[14px] text-alert">As saídas passaram das entradas e do saldo anterior.</span>}
              <span data-testid="text-home-result" className="mt-1 block text-[14px] text-ink-soft">{signed(cash.resultAmount)} neste mês</span>
            </div>
            {balanceChart}
          </Panel>

          {/* RF-03: fatura do mês aberto e as colunas das 7 faturas; abre Cartões. */}
          <Panel testId="card-home-invoice" dot="bg-chart-violet" title="Cartões" label={`Abrir Cartões, fatura ${money(cash.cardsAmount)}`} onOpen={() => go('cards')} delay=".04s">
            <div className="min-w-0">
              {cash.cardsAmount > 0
                ? <>
                  <span data-testid="text-home-invoice" className={`${value} text-ink`}>{money(cash.cardsAmount)}</span>
                  <span className="mt-1 block text-[14px] text-ink-soft">Fatura de {monthName(month)}{cards.length > 1 ? ` · ${cards.length} cartões` : ''}</span>
                </>
                : <span className="block text-[15px] text-ink-soft">Nenhuma fatura neste mês.</span>}
            </div>
            {invoiceChart}
          </Panel>

          {/* RF-04: total disponível e o uso de todos os benefícios; abre Benefícios. */}
          <Panel testId="card-home-benefits" dot="bg-chart-rose" title="Benefícios" label={`Abrir Benefícios, disponível ${money(benefitAvailable)}`} onOpen={() => go('benefits')} delay=".08s">
            {benefits.length === 0
              ? <span className="block text-[15px] text-ink-soft">Nenhum benefício cadastrado.</span>
              : <>
                <div className="min-w-0">
                  <span data-testid="text-home-benefits" className={`${value} text-ink`}>{money(benefitAvailable)}</span>
                  <span className="mt-1 block text-[14px] text-ink-soft">disponível de {money(benefitTotal)}</span>
                  <span className="block text-[14px] font-semibold text-ink">{isHidden() ? '••' : usedPercent}% usado</span>
                </div>
                <UsageBar spent={benefitSpent} total={benefitTotal}/>
              </>}
          </Panel>

          {/* Sonhos D12, RN-17: o plano e uma barra por sonho ativo (até 3); sem sonhos convida a criar; a falha só derruba este painel. */}
          <Panel testId="card-home-dreams" dot="bg-chart-in" title="Sonhos" label="Abrir Sonhos" onOpen={() => navigate('/sonhos')} delay=".1s">
            {dreamsQuery.isError || planQuery.isError
              ? <span data-testid="text-home-dreams-error" className="block text-[15px] text-ink-soft">Sonhos indisponível</span>
              : !dreamsQuery.data || !planQuery.data
                ? <div aria-busy="true" className="h-12 w-full animate-pulse rounded-lg bg-line"/>
                : activeDreams.length === 0
                  ? <span data-testid="text-home-dreams-empty" className="block text-[15px] text-ink-soft">Crie sua primeira caixinha e acompanhe quanto falta.</span>
                  : <div className="min-w-0 flex-1">
                    <span data-testid="text-home-dreams" className="block text-[16px] font-semibold text-ink">
                      {planQuery.data.hasPlan && planQuery.data.percent > 0
                        ? `Guardando ${money(planQuery.data.monthlyAmount)} por mês · ${isHidden() ? '••' : planQuery.data.percent}% da renda`
                        : 'Defina quanto guardar por mês'}
                    </span>
                    <ul className="mt-2 space-y-2">
                      {activeDreams.slice(0, DREAM_LIMIT).map((dream) => <li key={dream.id} data-testid={`row-home-dream-${dream.id}`}>
                        <span className="flex items-center justify-between gap-2 text-[14px] text-ink"><span className="min-w-0 truncate">{dream.name}</span><span className="shrink-0 font-mono-data text-ink-soft">{isHidden() ? '••%' : `${Math.round(dream.percent)}%`}</span></span>
                        <span aria-hidden className="mt-1 block">{isHidden() ? <HiddenChart height={8}/> : <span className="block h-2 overflow-hidden rounded-full bg-chart-track"><span className="block h-full rounded-full bg-chart-in" style={{ width: `${Math.min(100, dream.percent)}%` }}/></span>}</span>
                      </li>)}
                    </ul>
                    {activeDreams.length > DREAM_LIMIT && <span className="mt-2 block text-[14px] text-ink-soft">e mais {activeDreams.length - DREAM_LIMIT}</span>}
                  </div>}
          </Panel>

          {/* RF-06, D7: os 3 últimos gastos do mês aberto; "Ver todos" abre o Resumo do mês. */}
          <section aria-label="Lançamentos recentes" className="enter pt-2" style={{ animationDelay: '.12s' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Lançamentos recentes</h2>
              <button data-testid="link-home-recent-all" onClick={() => navigate(summaryPath(month))} className="-mr-2 flex h-12 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-brand transition hover:bg-hover">Ver todos<ChevronRight size={18}/></button>
            </div>
            {recent.isError ? <p className="py-3 text-[14px] text-ink-soft">Lançamentos indisponíveis agora.</p>
              : recentItems.length === 0 ? <p data-testid="text-home-recent-empty" className="py-3 text-[14px] text-ink-soft">Nenhum gasto neste mês até agora.</p>
              : <ul data-testid="list-home-recent" className="divide-y divide-line border-y border-line">
                {recentItems.map((item, index) => <li key={`${item.area}-${item.id}-${item.date}-${index}`}>
                  <button data-testid={`row-home-recent-${index}`} onClick={() => go(item.area)} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-hover">
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold text-ink">{item.description}</span><span className="block truncate text-[14px] text-ink-soft">{item.origin} · {dateLabel(item.date)}</span></span>
                    <span className="shrink-0 text-[15px] font-semibold text-ink">−{NBSP}{money(item.amount)}</span>
                  </button>
                </li>)}
              </ul>}
          </section>

          <nav aria-label="Atalhos" className="grid grid-cols-3 gap-2 pt-1">
            {([['income', 'Entradas', HandCoins], ['cards', 'Cartões', CreditCard], ['benefits', 'Benefícios', Utensils]] as const).map(([area, label, Icon]) => <button key={area} data-testid={`shortcut-${area}`} onClick={() => go(area)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2 text-[14px] font-semibold text-brand transition hover:bg-hover"><Icon size={16}/>{label}</button>)}
          </nav>
        </div>}
    </div>

    {/* Carrinho D3, RF-09, RN-13, RN-17: a barra só aparece com produtos; uma leitura que falha só a esconde. */}
    {cartBar && cart && <button type="button" data-testid="bar-home-cart" aria-label={`Abrir o carrinho: ${plural(cart.itemCount, 'item', 'itens')}, ${money(cart.total)}`} onClick={() => navigate('/carrinho')}
      className="fixed inset-x-4 bottom-[calc(88px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] z-30 mx-auto flex h-14 max-w-[828px] items-center gap-2 rounded-full border border-line bg-surface px-3 text-left min-[420px]:gap-3 min-[420px]:px-4 shadow-[0_8px_18px_-12px_rgba(0,0,0,.6)] transition hover:bg-hover">
      <span aria-hidden className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint text-brand"><ShoppingCart size={18}/><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 font-mono-data text-[12px] text-on-brand">{cart.itemCount}</span></span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink min-[420px]:text-[15px]">Carrinho · {plural(cart.itemCount, 'item', 'itens')}</span>
      <span className="shrink-0 font-mono-data text-[14px] text-ink min-[420px]:text-[15px]">{money(cart.total)}</span>
      <span aria-hidden className="flex shrink-0 items-center text-[14px] text-ink-soft"><span className="hidden min-[420px]:inline">Abrir</span><ChevronRight size={16}/></span>
    </button>}
  </main>;
}
