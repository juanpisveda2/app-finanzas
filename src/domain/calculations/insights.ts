import { Category, Movement } from '../models';

export type ExpenseCategorySlice = {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
  isOther?: boolean;
};

export type ExpenseBreakdown = {
  total: number;
  items: ExpenseCategorySlice[];
};

const FALLBACK_COLORS = [
  '#2E86DE',
  '#F6B93B',
  '#3DC1D3',
  '#E66767',
  '#786FA6',
  '#63C67B',
];

const OTHER_COLOR = '#9AA0A6';

type BreakdownOptions = {
  maxItems?: number;
  minPercent?: number;
};

export function getExpenseBreakdown(
  movements: Movement[],
  categories: Category[],
  options: BreakdownOptions = {}
): ExpenseBreakdown {
  const expenseMovements = movements.filter((movement) => movement.type === 'expense');
  const total = expenseMovements.reduce((sum, movement) => sum + movement.amount, 0);

  if (total <= 0) {
    return { total: 0, items: [] };
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, number>();

  expenseMovements.forEach((movement) => {
    const current = totals.get(movement.categoryId) ?? 0;
    totals.set(movement.categoryId, current + movement.amount);
  });

  const entries = Array.from(totals.entries()).map(([categoryId, amount], index) => {
    const category = categoryMap.get(categoryId);
    return {
      id: categoryId,
      label: category?.name ?? 'Sin categoria',
      amount,
      color: category?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });

  const sorted = entries.sort((a, b) => b.amount - a.amount);
  const maxItems = options.maxItems ?? 5;
  const minPercent = options.minPercent ?? 0.05;

  const items: ExpenseCategorySlice[] = [];
  let othersTotal = 0;

  sorted.forEach((item, index) => {
    const percentage = item.amount / total;
    const overLimit = sorted.length > maxItems && index >= maxItems - 1;
    const tooSmall = percentage < minPercent && sorted.length > 1;
    if (overLimit || tooSmall) {
      othersTotal += item.amount;
    } else {
      items.push({ ...item, percentage });
    }
  });

  if (othersTotal > 0) {
    items.push({
      id: 'other',
      label: 'Otros',
      amount: othersTotal,
      percentage: othersTotal / total,
      color: OTHER_COLOR,
      isOther: true,
    });
  }

  return {
    total,
    items: items.map((item) => ({
      ...item,
      percentage: item.amount / total,
    })),
  };
}

export function getFixedExpenseShare(
  movements: Movement[],
  categories: Category[]
): {
  fixedTotal: number;
  variableTotal: number;
  fixedShare: number;
} | null {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const expenseMovements = movements.filter((movement) => movement.type === 'expense');

  if (expenseMovements.length === 0) {
    return null;
  }

  const fixedTotal = expenseMovements.reduce((sum, movement) => {
    const category = categoryMap.get(movement.categoryId);
    const kind = movement.expenseKind ?? category?.nature;
    if (kind === 'fixed') {
      return sum + movement.amount;
    }
    return sum;
  }, 0);

  const total = expenseMovements.reduce((sum, movement) => sum + movement.amount, 0);
  const variableTotal = Math.max(total - fixedTotal, 0);

  if (total <= 0) {
    return null;
  }

  return {
    fixedTotal,
    variableTotal,
    fixedShare: fixedTotal / total,
  };
}
