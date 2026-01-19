import { create } from 'zustand';

import { Category } from '../domain/models';
import { CategoriesRepository } from '../data/repositories/categoriesRepository';

type CategoriesState = {
  items: Category[];
  loading: boolean;
  load: () => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await CategoriesRepository.list();
    set({ items, loading: false });
  },
  addCategory: async (category) => {
    await CategoriesRepository.create(category);
    await get().load();
  },
  updateCategory: async (category) => {
    await CategoriesRepository.update(category);
    await get().load();
  },
  deleteCategory: async (id) => {
    await CategoriesRepository.delete(id);
    await get().load();
  },
}));
