import { create } from 'zustand';

import { Goal } from '../domain/models';
import { GoalsRepository } from '../data/repositories/goalsRepository';

type GoalsState = {
  items: Goal[];
  loading: boolean;
  load: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
};

export const useGoalsStore = create<GoalsState>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await GoalsRepository.list();
    set({ items, loading: false });
  },
  addGoal: async (goal) => {
    await GoalsRepository.create(goal);
    await get().load();
  },
  updateGoal: async (goal) => {
    await GoalsRepository.update(goal);
    await get().load();
  },
  deleteGoal: async (id) => {
    await GoalsRepository.delete(id);
    await get().load();
  },
}));
