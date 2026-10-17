import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getGetIncomeRangeQueryKey, getGetLastPlannedMonthQueryKey, useGetIncomeRange, useGetLastPlannedMonth } from '@workspace/api-client-react';
import { currentMonth, isFutureMonth, isMonthKey } from '@/lib/format';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Historico from '@/pages/historico';
import Entradas from '@/pages/entradas';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

const queryClient = new QueryClient();

// Invalid months go back to the current one (RN-03), and so do future months
// past the last planned installment (installments RN-14); the current month
// always lives at "/".
function MonthRoute({ month }: { month: string }) {
  const lastPlanned = useGetLastPlannedMonth({ query: { queryKey: getGetLastPlannedMonthQueryKey(), enabled: isMonthKey(month) && isFutureMonth(month) } });
  if (!isMonthKey(month) || month === currentMonth()) return <Redirect to="/" replace />;
  if (isFutureMonth(month)) {
    if (lastPlanned.isLoading) return null;
    if (!lastPlanned.data || month > lastPlanned.data) return <Redirect to="/" replace />;
  }
  return <Dashboard key={month} month={month} />;
}

// Income months outside [oldest income, now + 12 months] go back to the current
// one (income RN-09); the current month always lives at "/entradas".
function IncomeMonthRoute({ month }: { month: string }) {
  const range = useGetIncomeRange({ query: { queryKey: getGetIncomeRangeQueryKey() } });
  if (!isMonthKey(month) || month === currentMonth()) return <Redirect to="/entradas" replace />;
  if (range.isLoading) return null;
  if (!range.data || month < range.data.first || month > range.data.last) return <Redirect to="/entradas" replace />;
  return <Entradas key={month} month={month} />;
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
        <Route path="/entradas/mes/:month">{(params) => <IncomeMonthRoute month={params.month} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Hash routes: the bundle uses a relative base, so nested paths would
            break asset URLs on reload. */}
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
