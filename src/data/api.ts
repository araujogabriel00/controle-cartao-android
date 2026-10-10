// Local replacement for @workspace/api-client-react: same hook names and call
// shapes, backed by on-device storage instead of the remote API.
import {
  useMutation, useQuery,
  type QueryKey, type UseMutationOptions, type UseQueryOptions,
} from '@tanstack/react-query';
import * as store from './store';

export type {
  Card, Cards, CardColor, Category, Consolidated, Movement, Overview, MonthKey, MonthSummary, MonthStatus,
  CardInput, CategoryInput, MovementInput,
} from './store';

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T, Error, T, QueryKey>> };
type MutationOpts<TData, TVars> = { mutation?: UseMutationOptions<TData, Error, TVars> };

// Called with fewer arguments, the keys work as prefixes that match every card
// and every month.
const key = (...parts: (string | number | undefined)[]) => {
  const end = parts.indexOf(undefined);
  return (end === -1 ? parts : parts.slice(0, end)) as QueryKey;
};

export const getHealthCheckQueryKey = () => ['health'] as const;
export const getGetCardsQueryKey = (month?: store.MonthKey) => key('cards', month);
export const getGetCardQueryKey = (cardId?: number, month?: store.MonthKey) => key('card', cardId, month);
export const getGetOverviewQueryKey = (cardId?: number, month?: store.MonthKey) => key('overview', cardId, month);
export const getGetCategoriesQueryKey = (cardId?: number, month?: store.MonthKey) => key('categories', cardId, month);
export const getGetMovementsQueryKey = (categoryId: number) => ['movements', categoryId] as const;
export const getGetMonthHistoryQueryKey = (cardId?: number) => key('months', cardId);
export const getGetMonthStatusQueryKey = (cardId?: number) => key('months', cardId, 'status');
export const getGetConsolidatedQueryKey = (month?: store.MonthKey) => key('consolidated', month);
export const getGetConsolidatedHistoryQueryKey = () => ['consolidated', 'history'] as const;

function useLocalQuery<T>(queryKey: QueryKey, queryFn: () => Promise<T>, options?: QueryOpts<T>) {
  return useQuery<T, Error, T, QueryKey>({ queryKey, queryFn, ...options?.query });
}

// There is no server to reach, so the app is always "in sync".
export const useHealthCheck = (options?: QueryOpts<{ status: string }>) =>
  useLocalQuery(getHealthCheckQueryKey(), async () => ({ status: 'ok' }), options);

export const useGetCards = (month: store.MonthKey, options?: QueryOpts<store.Cards>) =>
  useLocalQuery(getGetCardsQueryKey(month), () => store.getCards(month), options);

export const useGetCard = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.Card | null>) =>
  useLocalQuery(getGetCardQueryKey(cardId, month), () => store.getCard(cardId, month), options);

export const useGetOverview = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.Overview>) =>
  useLocalQuery(getGetOverviewQueryKey(cardId, month), () => store.getOverview(cardId, month), options);

export const useGetCategories = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.Category[]>) =>
  useLocalQuery(getGetCategoriesQueryKey(cardId, month), () => store.getCategories(cardId, month), options);

export const useGetMovements = (categoryId: number, options?: QueryOpts<store.Movement[]>) =>
  useLocalQuery(getGetMovementsQueryKey(categoryId), () => store.getMovements(categoryId), options);

export const useGetMonthHistory = (cardId: number, options?: QueryOpts<store.MonthSummary[]>) =>
  useLocalQuery(getGetMonthHistoryQueryKey(cardId), () => store.getMonthHistory(cardId), options);

export const useGetMonthStatus = (cardId: number, options?: QueryOpts<store.MonthStatus>) =>
  useLocalQuery(getGetMonthStatusQueryKey(cardId), () => store.getMonthStatus(cardId), options);

export const useGetConsolidated = (month: store.MonthKey, options?: QueryOpts<store.Consolidated>) =>
  useLocalQuery(getGetConsolidatedQueryKey(month), () => store.getConsolidated(month), options);

export const useGetConsolidatedHistory = (options?: QueryOpts<store.Consolidated[]>) =>
  useLocalQuery(getGetConsolidatedHistoryQueryKey(), store.getConsolidatedHistory, options);

export const useStartMonth = (options?: MutationOpts<void, { cardId: number; month: store.MonthKey; copyFrom: store.MonthKey | null }>) =>
  useMutation({ mutationFn: ({ cardId, month, copyFrom }) => store.startMonth(cardId, month, copyFrom), ...options?.mutation });

export const useSelectCard = (options?: MutationOpts<void, { cardId: number }>) =>
  useMutation({ mutationFn: ({ cardId }) => store.selectCard(cardId), ...options?.mutation });

export const useCreateCard = (options?: MutationOpts<store.StoredCard, { data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.saveCard(data, 'create'), ...options?.mutation });

export const useUpdateCard = (options?: MutationOpts<store.StoredCard, { cardId: number; data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ cardId, data }) => store.saveCard(data, 'update', cardId), ...options?.mutation });

export const useDeleteCard = (options?: MutationOpts<void, { cardId: number }>) =>
  useMutation({ mutationFn: ({ cardId }) => store.deleteCard(cardId), ...options?.mutation });

export const useCreateCategory = (options?: MutationOpts<store.StoredCategory, { cardId: number; month: store.MonthKey; data: store.CategoryInput }>) =>
  useMutation({ mutationFn: ({ cardId, month, data }) => store.createCategory(cardId, month, data), ...options?.mutation });

export const useUpdateCategory = (options?: MutationOpts<store.StoredCategory, { categoryId: number; data: store.CategoryInput }>) =>
  useMutation({ mutationFn: ({ categoryId, data }) => store.updateCategory(categoryId, data), ...options?.mutation });

export const useDeleteCategory = (options?: MutationOpts<void, { categoryId: number }>) =>
  useMutation({ mutationFn: ({ categoryId }) => store.deleteCategory(categoryId), ...options?.mutation });

export const useSetCategoryClosed = (options?: MutationOpts<store.StoredCategory, { categoryId: number; data: { isClosed: boolean } }>) =>
  useMutation({ mutationFn: ({ categoryId, data }) => store.setCategoryClosed(categoryId, data.isClosed), ...options?.mutation });

export const useCreateMovement = (options?: MutationOpts<store.Movement, { categoryId: number; data: store.MovementInput }>) =>
  useMutation({ mutationFn: ({ categoryId, data }) => store.createMovement(categoryId, data), ...options?.mutation });

export const useUpdateMovement = (options?: MutationOpts<store.Movement, { movementId: number; data: store.MovementInput }>) =>
  useMutation({ mutationFn: ({ movementId, data }) => store.updateMovement(movementId, data), ...options?.mutation });

export const useDeleteMovement = (options?: MutationOpts<void, { movementId: number }>) =>
  useMutation({ mutationFn: ({ movementId }) => store.deleteMovement(movementId), ...options?.mutation });
