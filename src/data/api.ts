// Local replacement for @workspace/api-client-react: same hook names and call
// shapes, backed by on-device storage instead of the remote API.
import {
  useMutation, useQuery,
  type QueryKey, type UseMutationOptions, type UseQueryOptions,
} from '@tanstack/react-query';
import * as store from './store';

export type {
  Card, Cards, CardColor, Category, CategorySummary, Consolidated, Movement, MonthKey, MonthSummary, MonthStatus,
  FutureInstallments, MonthPreview, PlannedInstallment, StoredPurchase,
  CardInput, CategoryInput, MovementInput, PurchaseInput,
  IncomeInput, IncomeKind, IncomeOccurrence, IncomeRange, IncomeScope, Incomes, StoredIncome,
  Benefits, BenefitItem, BenefitSpend, BenefitRange, BenefitInput, BenefitUpdate, BenefitSpendInput, BenefitSplitItem, BenefitCategoryRow, StoredBenefit, StoredBenefitSpend,
} from './store';
export { INCOME_KINDS } from './store';

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
export const getGetCategoriesQueryKey = () => ['categories'] as const;
export const getGetCategorySummaryQueryKey = (cardId?: number, month?: store.MonthKey) => key('category-summary', cardId, month);
export const getGetMovementsQueryKey = (cardId?: number, month?: store.MonthKey) => key('movements', cardId, month);
export const getGetMonthHistoryQueryKey = (cardId?: number) => key('months', cardId);
export const getGetMonthStatusQueryKey = (cardId?: number) => key('months', cardId, 'status');
export const getGetConsolidatedQueryKey = (month?: store.MonthKey) => key('consolidated', month);
export const getGetConsolidatedHistoryQueryKey = () => ['consolidated', 'history'] as const;
export const getGetFutureInstallmentsQueryKey = (cardId?: number) => key('installments', cardId);
export const getGetMonthPreviewQueryKey = (cardId: number, month: store.MonthKey) => ['installments', cardId, 'preview', month] as const;
export const getGetLastFutureMonthQueryKey = () => ['installments', 'last'] as const;
export const getGetIncomesQueryKey = (month?: store.MonthKey) => key('incomes', month);
export const getGetIncomeRangeQueryKey = () => ['income-range'] as const;
export const getGetBenefitsQueryKey = (month?: store.MonthKey) => key('benefits', month);
export const getGetBenefitRangeQueryKey = () => ['benefit-range'] as const;

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

export const useGetCategories = (options?: QueryOpts<store.Category[]>) =>
  useLocalQuery(getGetCategoriesQueryKey(), store.getCategories, options);

export const useGetCategorySummary = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.CategorySummary[]>) =>
  useLocalQuery(getGetCategorySummaryQueryKey(cardId, month), () => store.getCategorySummary(cardId, month), options);

export const useGetMovements = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.Movement[]>) =>
  useLocalQuery(getGetMovementsQueryKey(cardId, month), () => store.getMovements(cardId, month), options);

export const useGetMonthHistory = (cardId: number, options?: QueryOpts<store.MonthSummary[]>) =>
  useLocalQuery(getGetMonthHistoryQueryKey(cardId), () => store.getMonthHistory(cardId), options);

export const useGetMonthStatus = (cardId: number, options?: QueryOpts<store.MonthStatus>) =>
  useLocalQuery(getGetMonthStatusQueryKey(cardId), () => store.getMonthStatus(cardId), options);

export const useGetConsolidated = (month: store.MonthKey, options?: QueryOpts<store.Consolidated>) =>
  useLocalQuery(getGetConsolidatedQueryKey(month), () => store.getConsolidated(month), options);

export const useGetConsolidatedHistory = (options?: QueryOpts<store.Consolidated[]>) =>
  useLocalQuery(getGetConsolidatedHistoryQueryKey(), store.getConsolidatedHistory, options);

export const useGetFutureInstallments = (cardId: number, options?: QueryOpts<store.FutureInstallments[]>) =>
  useLocalQuery(getGetFutureInstallmentsQueryKey(cardId), () => store.getFutureInstallments(cardId), options);

export const useGetMonthPreview = (cardId: number, month: store.MonthKey, options?: QueryOpts<store.MonthPreview>) =>
  useLocalQuery(getGetMonthPreviewQueryKey(cardId, month), () => store.getMonthPreview(cardId, month), options);

export const useGetLastFutureMonth = (options?: QueryOpts<store.MonthKey | null>) =>
  useLocalQuery(getGetLastFutureMonthQueryKey(), store.getLastFutureMonth, options);

export const useStartMonth = (options?: MutationOpts<void, { cardId: number; month: store.MonthKey }>) =>
  useMutation({ mutationFn: ({ cardId, month }) => store.startMonth(cardId, month), ...options?.mutation });

export const useSelectCard = (options?: MutationOpts<void, { cardId: number }>) =>
  useMutation({ mutationFn: ({ cardId }) => store.selectCard(cardId), ...options?.mutation });

export const useCreateCard = (options?: MutationOpts<store.StoredCard, { data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.saveCard(data, 'create'), ...options?.mutation });

export const useUpdateCard = (options?: MutationOpts<store.StoredCard, { cardId: number; data: store.CardInput }>) =>
  useMutation({ mutationFn: ({ cardId, data }) => store.saveCard(data, 'update', cardId), ...options?.mutation });

export const useDeleteCard = (options?: MutationOpts<void, { cardId: number }>) =>
  useMutation({ mutationFn: ({ cardId }) => store.deleteCard(cardId), ...options?.mutation });

export const useCreateCategory = (options?: MutationOpts<store.StoredCategory, { data: store.CategoryInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.createCategory(data), ...options?.mutation });

export const useUpdateCategory = (options?: MutationOpts<store.StoredCategory, { categoryId: number; data: store.CategoryInput }>) =>
  useMutation({ mutationFn: ({ categoryId, data }) => store.updateCategory(categoryId, data), ...options?.mutation });

export const useDeleteCategory = (options?: MutationOpts<void, { categoryId: number }>) =>
  useMutation({ mutationFn: ({ categoryId }) => store.deleteCategory(categoryId), ...options?.mutation });

export const useCreateMovement = (options?: MutationOpts<store.StoredMovement, { cardId: number; categoryId: number | null; data: store.MovementInput }>) =>
  useMutation({ mutationFn: ({ cardId, categoryId, data }) => store.createMovement(cardId, categoryId, data), ...options?.mutation });

export const useUpdateMovement = (options?: MutationOpts<store.StoredMovement, { movementId: number; categoryId: number | null; data: store.MovementInput }>) =>
  useMutation({ mutationFn: ({ movementId, categoryId, data }) => store.updateMovement(movementId, categoryId, data), ...options?.mutation });

export const useDeleteMovement = (options?: MutationOpts<void, { movementId: number }>) =>
  useMutation({ mutationFn: ({ movementId }) => store.deleteMovement(movementId), ...options?.mutation });

export const useCreatePurchase = (options?: MutationOpts<store.StoredPurchase, { cardId: number; categoryId: number | null; data: store.PurchaseInput }>) =>
  useMutation({ mutationFn: ({ cardId, categoryId, data }) => store.createPurchase(cardId, categoryId, data), ...options?.mutation });

export const useUpdatePurchase = (options?: MutationOpts<store.StoredPurchase, { purchaseId: number; categoryId: number | null; data: store.PurchaseInput }>) =>
  useMutation({ mutationFn: ({ purchaseId, categoryId, data }) => store.updatePurchase(purchaseId, categoryId, data), ...options?.mutation });

export const useDeletePurchase = (options?: MutationOpts<void, { purchaseId: number }>) =>
  useMutation({ mutationFn: ({ purchaseId }) => store.deletePurchase(purchaseId), ...options?.mutation });

export const useGetIncomes = (month: store.MonthKey, options?: QueryOpts<store.Incomes>) =>
  useLocalQuery(getGetIncomesQueryKey(month), () => store.getIncomes(month), options);

export const useGetIncomeRange = (options?: QueryOpts<store.IncomeRange>) =>
  useLocalQuery(getGetIncomeRangeQueryKey(), store.getIncomeRange, options);

export const useCreateIncome = (options?: MutationOpts<store.StoredIncome, { data: store.IncomeInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.createIncome(data), ...options?.mutation });

export const useUpdateIncome = (options?: MutationOpts<store.StoredIncome, { incomeId: number; month: store.MonthKey; scope: store.IncomeScope; data: store.IncomeInput }>) =>
  useMutation({ mutationFn: ({ incomeId, month, scope, data }) => store.updateIncome(incomeId, month, scope, data), ...options?.mutation });

export const useDeleteIncome = (options?: MutationOpts<void, { incomeId: number; month: store.MonthKey; scope: store.IncomeScope }>) =>
  useMutation({ mutationFn: ({ incomeId, month, scope }) => store.deleteIncome(incomeId, month, scope), ...options?.mutation });

export const useGetBenefits = (month: store.MonthKey, options?: QueryOpts<store.Benefits>) =>
  useLocalQuery(getGetBenefitsQueryKey(month), () => store.getBenefits(month), options);

export const useGetBenefitRange = (options?: QueryOpts<store.BenefitRange>) =>
  useLocalQuery(getGetBenefitRangeQueryKey(), store.getBenefitRange, options);

export const useCreateBenefit = (options?: MutationOpts<store.StoredBenefit, { data: store.BenefitInput }>) =>
  useMutation({ mutationFn: ({ data }) => store.createBenefit(data), ...options?.mutation });

export const useUpdateBenefit = (options?: MutationOpts<store.StoredBenefit, { benefitId: number; month: store.MonthKey; data: store.BenefitUpdate }>) =>
  useMutation({ mutationFn: ({ benefitId, month, data }) => store.updateBenefit(benefitId, month, data), ...options?.mutation });

export const useDeleteBenefit = (options?: MutationOpts<void, { benefitId: number }>) =>
  useMutation({ mutationFn: ({ benefitId }) => store.deleteBenefit(benefitId), ...options?.mutation });

export const useCreateBenefitSpend = (options?: MutationOpts<store.StoredBenefitSpend, { benefitId: number; categoryId: number | null; data: store.BenefitSpendInput }>) =>
  useMutation({ mutationFn: ({ benefitId, categoryId, data }) => store.createBenefitSpend(benefitId, categoryId, data), ...options?.mutation });

export const useUpdateBenefitSpend = (options?: MutationOpts<store.StoredBenefitSpend, { spendId: number; categoryId: number | null; data: store.BenefitSpendInput }>) =>
  useMutation({ mutationFn: ({ spendId, categoryId, data }) => store.updateBenefitSpend(spendId, categoryId, data), ...options?.mutation });

export const useDeleteBenefitSpend = (options?: MutationOpts<void, { spendId: number }>) =>
  useMutation({ mutationFn: ({ spendId }) => store.deleteBenefitSpend(spendId), ...options?.mutation });

export const useCloseBenefitCategory = (options?: MutationOpts<void, { benefitId: number; categoryId: number; month: store.MonthKey }>) =>
  useMutation({ mutationFn: ({ benefitId, categoryId, month }) => store.closeBenefitCategory(benefitId, categoryId, month), ...options?.mutation });

export const useReopenBenefitCategory = (options?: MutationOpts<void, { benefitId: number; categoryId: number; month: store.MonthKey }>) =>
  useMutation({ mutationFn: ({ benefitId, categoryId, month }) => store.reopenBenefitCategory(benefitId, categoryId, month), ...options?.mutation });
