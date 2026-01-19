import { create } from 'zustand';

import { Movement } from '../domain/models';
import { MovementsRepository } from '../data/repositories/movementsRepository';

type MovementsState = {
  items: Movement[];
  loading: boolean;
  selectedMonth: Date;
  loadMonth: (date?: Date) => Promise<void>;
  setMonth: (date: Date) => Promise<void>;
  addMovement: (movement: Movement) => Promise<void>;
  updateMovement: (movement: Movement) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
};

export const useMovementsStore = create<MovementsState>((set, get) => ({
  items: [],
  loading: false,
  selectedMonth: new Date(),
  loadMonth: async (date) => {
    const selected = date ?? get().selectedMonth;
    set({ loading: true });
    const items = await MovementsRepository.listByMonth(selected);
    set({ items, loading: false, selectedMonth: selected });
  },
  setMonth: async (date) => {
    await get().loadMonth(date);
  },
  addMovement: async (movement) => {
    await MovementsRepository.create(movement);
    await get().loadMonth();
  },
  updateMovement: async (movement) => {
    await MovementsRepository.update(movement);
    await get().loadMonth();
  },
  deleteMovement: async (id) => {
    await MovementsRepository.delete(id);
    await get().loadMonth();
  },
}));
