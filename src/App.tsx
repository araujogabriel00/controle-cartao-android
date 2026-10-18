import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getGetBenefitRangeQueryKey, getGetIncomeRangeQueryKey, getGetLastFutureMonthQueryKey, useGetBenefitRange, useGetIncomeRange, useGetLastFutureMonth } from '@workspace/api-client-react';
import { areaPath, currentMonth, isFutureMonth, isMonthKey, listPath, type ListKind } from '@/lib/format';
import { readLastMonth } from '@/lib/last-month';
import { FooterMenu } from '@/components/quick-add';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Historico from '@/pages/historico';
import Entradas from '@/pages/entradas';
import EntradasLista from '@/pages/entradas-lista';
import Beneficios from '@/pages/beneficios';
import Categorias from '@/pages/categorias';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

const queryClient = new QueryClient();

// An invalid month goes back to the current one (RN-06). A month the area doesn't
// open goes to the nearest one it does (RN-05): Cartões opens up to the last month
// with a planned charge or a purchase (installments RN-14); the current month
// always lives at the area's short route.
function MonthRoute({ month }: { month: string }) {
  const lastPlanned = useGetLastFutureMonth({ query: { queryKey: getGetLastFutureMonthQueryKey(), enabled: isMonthKey(month) && isFutureMonth(month) } });
  if (!isMonthKey(month) || month === currentMonth()) return <Redirect to="/" replace />;
  if (isFutureMonth(month)) {
    if (lastPlanned.isLoading) return null;
    if (!lastPlanned.data) return <Redirect to="/" replace />;
    if (month > lastPlanned.data) return <Redirect to={areaPath('cards', lastPlanned.data)} replace />;
  }
  return <Dashboard key={month} month={month} />;
}

// Income and benefit months open from the oldest one (never after now) to now + 12
// months (income RN-09, benefits RN-12); outside that, the nearest one opens.
function RangedMonthRoute({ area, month, range, children }: {
  area: 'income' | 'benefits'; month: string; range: { data?: { first: string; last: string }; isLoading: boolean }; children: ReactNode;
}) {
  if (!isMonthKey(month) || month === currentMonth()) return <Redirect to={areaPath(area, currentMonth())} replace />;
  if (range.isLoading) return null;
  if (!range.data) return <Redirect to={areaPath(area, currentMonth())} replace />;
  const target = month < range.data.first ? range.data.first : month > range.data.last ? range.data.last : month;
  if (target !== month) return <Redirect to={areaPath(area, target)} replace />;
  return <>{children}</>;
}

function IncomeMonthRoute({ month }: { month: string }) {
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } });
  return <RangedMonthRoute area="income" month={month} range={range}><Entradas key={month} month={month} /></RangedMonthRoute>;
}

// Lists of the Entradas tab (specs/telas-de-entradas.md RF-06): an unknown list goes back to the
// tab; an invalid month goes to the current one; a month outside the tab's range goes to the nearest.
const LIST_KINDS: ListKind[] = ['entradas', 'contas-fixas', 'gastos', 'cartoes'];
function ListRoute({ kind, month }: { kind: string; month?: string }) {
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } });
  if (!LIST_KINDS.includes(kind as ListKind)) return <Redirect to="/entradas" replace />;
  const list = kind as ListKind;
  if (month === undefined) return <EntradasLista key={`${list}-${currentMonth()}`} kind={list} month={currentMonth()} />;
  if (!isMonthKey(month) || month === currentMonth()) return <Redirect to={listPath(list, currentMonth())} replace />;
  if (range.isLoading) return null;
  if (!range.data) return <Redirect to={listPath(list, currentMonth())} replace />;
  const target = month < range.data.first ? range.data.first : month > range.data.last ? range.data.last : month;
  if (target !== month) return <Redirect to={listPath(list, target)} replace />;
  return <EntradasLista key={`${list}-${month}`} kind={list} month={month} />;
}

function BenefitMonthRoute({ month }: { month: string }) {
  const range = useGetBenefitRange({ query: { queryKey: getGetBenefitRangeQueryKey() } });
  return <RangedMonthRoute area="benefits" month={month} range={range}><Beneficios key={month} month={month} /></RangedMonthRoute>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/">{() => <Dashboard key={currentMonth()} month={currentMonth()} />}</Route>
        <Route path="/mes/:month">{(params) => <MonthRoute month={params.month} />}</Route>
        <Route path="/historico" component={Historico} />
        <Route path="/entradas">{() => <Entradas key={currentMonth()} month={currentMonth()} />}</Route>
        <Route path="/entradas/lista/:kind">{(params) => <ListRoute kind={params.kind} />}</Route>
        <Route path="/entradas/lista/:kind/mes/:month">{(params) => <ListRoute kind={params.kind} month={params.month} />}</Route>
        <Route path="/entradas/mes/:month">{(params) => <IncomeMonthRoute month={params.month} />}</Route>
        <Route path="/beneficios">{() => <Beneficios key={currentMonth()} month={currentMonth()} />}</Route>
        <Route path="/beneficios/mes/:month">{(params) => <BenefitMonthRoute month={params.month} />}</Route>
        <Route path="/categorias" component={Categorias} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

// RF-08 / RN-10: on start, an empty address ("#/" or none) opens Cartões in the remembered
// month. It is read before the first screen shows, so the current month never flashes, and
// an address with a month, or of another area, is left alone (D9).
function Bootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void readLastMonth().then((last) => {
      if (!alive) return;
      const hash = window.location.hash;
      if (last && last !== currentMonth() && (hash === '' || hash === '#' || hash === '#/')) window.history.replaceState(null, '', `#${areaPath('cards', last)}`);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);
  return ready ? <>{children}</> : null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Hash routes: the bundle uses a relative base, so nested paths would
            break asset URLs on reload. */}
        <WouterRouter hook={useHashLocation}>
          <Bootstrap><Router /><FooterMenu /></Bootstrap>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
