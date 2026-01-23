import AsyncStorage from '@react-native-async-storage/async-storage';

import { createId } from '../../lib/ids';
import { parseISODate } from '../../lib/date';
import { GoalContribution } from '../../domain/models';

const CONTRIBUTIONS_KEY = 'goal_contributions_v1';
const QUICK_AMOUNTS_KEY = 'goal_quick_amounts_v1';

type QuickAmountsMap = Record<string, number[]>;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const compareContributions = (a: GoalContribution, b: GoalContribution) => {
  const dateA = parseISODate(a.date).getTime();
  const dateB = parseISODate(b.date).getTime();
  if (dateA !== dateB) {
    return dateB - dateA;
  }
  const createdA = new Date(a.createdAt).getTime();
  const createdB = new Date(b.createdAt).getTime();
  return createdB - createdA;
};

const sanitizeQuickAmounts = (amounts: number[]) =>
  amounts.filter((value) => Number.isFinite(value) && value > 0).slice(0, 3);

async function getAllContributions(): Promise<GoalContribution[]> {
  const raw = await AsyncStorage.getItem(CONTRIBUTIONS_KEY);
  return safeParse(raw, []);
}

async function saveAllContributions(items: GoalContribution[]) {
  await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(items));
}

export async function listGoalContributions(goalId: string) {
  const items = await getAllContributions();
  return items.filter((item) => item.goalId === goalId);
}

export async function addGoalContribution(input: {
  goalId: string;
  amount: number;
  date: string;
  note?: string | null;
}) {
  const next: GoalContribution = {
    id: createId('goal_contrib'),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const items = await getAllContributions();
  items.push(next);
  await saveAllContributions(items);
  return next;
}

export async function deleteGoalContribution(id: string) {
  const items = await getAllContributions();
  const filtered = items.filter((item) => item.id !== id);
  await saveAllContributions(filtered);
}

export async function deleteGoalContributionsByGoalId(goalId: string) {
  const items = await getAllContributions();
  const filtered = items.filter((item) => item.goalId !== goalId);
  await saveAllContributions(filtered);
}

export async function getLastGoalContributionMap() {
  const items = await getAllContributions();
  const lastMap: Record<string, GoalContribution> = {};
  for (const item of items) {
    const current = lastMap[item.goalId];
    if (!current || compareContributions(item, current) < 0) {
      lastMap[item.goalId] = item;
    }
  }
  return lastMap;
}

export async function getGoalQuickAmountsMap() {
  const raw = await AsyncStorage.getItem(QUICK_AMOUNTS_KEY);
  return safeParse<QuickAmountsMap>(raw, {});
}

export async function saveGoalQuickAmounts(goalId: string, amounts: number[]) {
  const sanitized = sanitizeQuickAmounts(amounts);
  const current = await getGoalQuickAmountsMap();
  const next = { ...current };
  if (sanitized.length === 0) {
    delete next[goalId];
  } else {
    next[goalId] = sanitized;
  }
  await AsyncStorage.setItem(QUICK_AMOUNTS_KEY, JSON.stringify(next));
  return next;
}
