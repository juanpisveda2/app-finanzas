import { addMonths, endOfMonth, format, isValid, parse, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const toLocalDate = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseISODateOnly = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    return new Date(Number.NaN);
  }
  return parse(match[1], 'yyyy-MM-dd', new Date());
};

export function formatMonth(date: Date) {
  return format(date, 'MMMM yyyy', { locale: es });
}

export function monthRange(date: Date) {
  return {
    start: toISODate(startOfMonth(date)),
    end: toISODate(endOfMonth(date)),
  };
}

export function shiftMonth(date: Date, delta: number) {
  return addMonths(date, delta);
}

export function toISODate(date: Date) {
  return format(toLocalDate(date), 'yyyy-MM-dd');
}

export function parseISODate(iso: string) {
  return parseISODateOnly(iso);
}

export function formatDateUI(date: string | Date) {
  const parsed = date instanceof Date ? toLocalDate(date) : parseISODateOnly(date);
  if (!isValid(parsed)) {
    return '';
  }
  return format(parsed, 'dd-MM-yyyy');
}

export function monthKey(date: Date) {
  const localDate = toLocalDate(date);
  if (!isValid(localDate)) {
    return '';
  }
  return format(localDate, 'yyyy-MM');
}
