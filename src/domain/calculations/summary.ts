import { Category, Movement } from '../models';
import { parseISODate } from '../../lib/date';

export function getMonthTotals(movements: Movement[]) {
  const income = movements
    .filter((movement) => movement.type === 'income')
    .reduce((sum, movement) => sum + movement.amount, 0);
  const expense = movements
    .filter((movement) => movement.type === 'expense')
    .reduce((sum, movement) => sum + movement.amount, 0);
  return {
    income,
    expense,
    balance: income - expense,
  };
}

export function getRecentMovements(movements: Movement[], limit: number = 5) {
  const getIdTime = (id: string) => {
    const parts = id.split('_');
    if (parts.length < 3) {
      return 0;
    }
    const time = Number.parseInt(parts[1], 36);
    return Number.isNaN(time) ? 0 : time;
  };
  return [...movements]
    .sort(
      (a, b) => {
        const diff = parseISODate(b.date).getTime() - parseISODate(a.date).getTime();
        if (diff !== 0) {
          return diff;
        }
        return getIdTime(b.id) - getIdTime(a.id);
      }
    )
    .slice(0, limit);
}

export function getTopExpenseCategory(
  movements: Movement[],
  categories: Category[]
) {
  const totals = new Map<string, number>();
  movements
    .filter((movement) => movement.type === 'expense')
    .forEach((movement) => {
      const current = totals.get(movement.categoryId) ?? 0;
      totals.set(movement.categoryId, current + movement.amount);
    });

  let topId: string | null = null;
  let topTotal = 0;
  totals.forEach((value, key) => {
    if (value > topTotal) {
      topTotal = value;
      topId = key;
    }
  });

  if (!topId) {
    return null;
  }

  const category = categories.find((item) => item.id === topId);
  if (!category) {
    return null;
  }

  return {
    category,
    total: topTotal,
  };
}
