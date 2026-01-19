import { Category } from '../models';

export function isCategoryVisibleForMonth(category: Category, monthKey: string) {
  if (!category.isActive) {
    return false;
  }
  if (!monthKey) {
    return true;
  }
  if (category.activeFrom && monthKey < category.activeFrom) {
    return false;
  }
  if (category.activeTo && monthKey > category.activeTo) {
    return false;
  }
  return true;
}
