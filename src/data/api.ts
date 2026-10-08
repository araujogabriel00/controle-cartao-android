// Local replacement for @workspace/api-client-react: same hook names and call
// shapes, backed by on-device storage instead of the remote API.
import {
  useMutation, useQuery,
  type QueryKey, type UseMutationOptions, type UseQueryOptions,
} from '@tanstack/react-query';
import * as store from './store';

export type { Card, Category, Movement, Overview, CardInput, CategoryInput, MovementInput } from './store';

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T, Error, T, QueryKey>> };
type MutationOpts<TData, TVars> = { mutation?: UseMutationOptions<TData, Error, TVars> };

export const getHealthCheckQueryKey = () => ['health'] as const;
export const getGetCardQueryKey = () => ['card'] as const;
export const getGetOverviewQueryKey = () => ['overview'] as const;
export const getGetCategoriesQueryKey = () => ['categories'] as const;
export const getGetMovementsQueryKey = (categoryId: number) => ['categories', categoryId, 'movements'] as const;

function useLocalQuery<T>(queryKey: QueryKey, queryFn: () => Promise<T>, options?: QueryOpts<T>) {
  return useQuery<T, Error, T, QueryKey>({ queryKey, queryFn, ...options?.query });
}

// There is no server to reach, so the app is always "in sync".
export const useHealthCheck = (options?: QueryOpts<{ status: string }>) =>
  useLocalQuery(getHealthCheckQueryKey(), async () => ({ status: 'ok' }), options);

export const useGetCard = (options?: QueryOpts<store.Card | null>) =>
  useLocalQuery(getGetCardQueryKey(), store.getCard, options);

export const useGetOverview = (options?: QueryOpts<store.Overview>) =>
  useLocalQuery(getGetOverviewQueryKey(), store.getOverview, options);

export const useGetCategories = (options?: QueryOpts<store.Category[]>) =>
  useLocalQuery(getGetCategoriesQueryKey(), store.getCategories, options);

export const useGetMovements = (categoryId: number, options?: QueryOpts<store.Movement[]>) =>
  useLocalQuery(getGetMovementsQueryKey(categoryId), () => store.getMovements(categoryId), options);

export const useCreateCard = (options?: MutationOpts<store.StoredCard, { data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.saveCard(data, 'create'), ...options?.mutation });

export const useUpdateCard = (options?: MutationOpts<store.StoredCard, { data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.saveCard(data, 'update'), ...options?.mutation });

export const useDeleteCard = (options?: MutationOpts<void, void>) =>
  useMutation({ mutationFn: () => store.deleteCard(), ...options?.mutation });

export const useCreateCategory = (options?: MutationOpts<store.StoredCategory, { data: store.CategoryInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.createCategory(data), ...options?.mutation });

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
