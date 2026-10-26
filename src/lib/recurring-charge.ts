import type { Movement, PlannedInstallment } from '@workspace/api-client-react';
import type { MonthKey } from '@/lib/format';

// One charge of a recurring purchase, recorded (a Movement) or planned (a PlannedInstallment of a future
// month): what the scope question, the edit dialog and the delete need (specs/compras-em-qualquer-mes.md RF-01).
export type RecurringCharge = {
  recurringId: number; description: string; amount: number; date: string; categoryId: number | null; lastMonth: MonthKey | null;
};

export const chargeOfMovement = (movement: Movement): RecurringCharge | null => movement.recurring ? {
  recurringId: movement.recurring.id, description: movement.description, amount: movement.amount, date: movement.date,
  categoryId: movement.categoryId, lastMonth: movement.recurring.lastMonth,
} : null;

export const chargeOfPlanned = (planned: PlannedInstallment): RecurringCharge | null => planned.recurring ? {
  recurringId: planned.recurring.id, description: planned.description, amount: planned.amount, date: planned.date,
  categoryId: planned.categoryId, lastMonth: planned.recurring.lastMonth,
} : null;

// Initial values of the edit dialog; the id only marks it as an edit (the mutation uses recurringId).
export const chargeDialog = (charge: RecurringCharge, scope: 'month' | 'forward') => ({
  id: charge.recurringId, categoryId: charge.categoryId, description: charge.description, amount: charge.amount, date: charge.date,
  isRecurring: true, recurringId: charge.recurringId, lastMonth: charge.lastMonth, scope,
});
