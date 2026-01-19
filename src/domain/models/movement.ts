export type MovementType = 'income' | 'expense';
export type ExpenseKind = 'fixed' | 'variable' | 'unusual';

export type Movement = {
  id: string;
  date: string;
  amount: number;
  type: MovementType;
  categoryId: string;
  description?: string;
  paymentMethod?: string;
  shared: boolean;
  sharedWith?: string;
  expenseKind?: ExpenseKind;
};
