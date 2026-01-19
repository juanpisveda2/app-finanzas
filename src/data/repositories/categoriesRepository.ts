import { getDb } from '../db/sqlite';
import { Category } from '../../domain/models';

type CategoryRow = Omit<
  Category,
  'nature' | 'isBasic' | 'isEnjoyment' | 'isActive' | 'activeFrom' | 'activeTo'
> & {
  isBasic: number;
  isEnjoyment: number;
  isActive: number;
  activeFrom?: string | null;
  activeTo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  nature?: string | null;
};

const mapCategory = (row: CategoryRow): Category => {
  const now = new Date().toISOString();
  return {
    ...row,
    nature: row.nature === 'fixed' ? 'fixed' : 'variable',
    isBasic: Boolean(row.isBasic),
    isEnjoyment: Boolean(row.isEnjoyment),
    isActive: Boolean(row.isActive),
    activeFrom: row.activeFrom ?? undefined,
    activeTo: row.activeTo ?? undefined,
    createdAt: row.createdAt ?? now,
    updatedAt: row.updatedAt ?? row.createdAt ?? now,
  };
};

export const CategoriesRepository = {
  async list() {
    const db = await getDb();
    const rows = await db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return rows.map(mapCategory);
  },

  async listVisibleForMonth(month: string) {
    const db = await getDb();
    const rows = await db.getAllAsync<CategoryRow>(
      `SELECT * FROM categories
       WHERE isActive = 1
         AND (activeFrom IS NULL OR activeFrom <= ?)
         AND (activeTo IS NULL OR activeTo >= ?)
       ORDER BY name ASC`,
      [month, month]
    );
    return rows.map(mapCategory);
  },

  async create(category: Category) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO categories
        (id, name, kind, nature, isBasic, isEnjoyment, color, isActive, activeFrom, activeTo, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.kind,
        category.nature,
        category.isBasic ? 1 : 0,
        category.isEnjoyment ? 1 : 0,
        category.color ?? null,
        category.isActive ? 1 : 0,
        category.activeFrom ?? null,
        category.activeTo ?? null,
        category.createdAt ?? now,
        category.updatedAt ?? now,
      ]
    );
  },

  async update(category: Category) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE categories
       SET name = ?, kind = ?, nature = ?, isBasic = ?, isEnjoyment = ?, color = ?,
           isActive = ?, activeFrom = ?, activeTo = ?, updatedAt = ?
       WHERE id = ?`,
      [
        category.name,
        category.kind,
        category.nature,
        category.isBasic ? 1 : 0,
        category.isEnjoyment ? 1 : 0,
        category.color ?? null,
        category.isActive ? 1 : 0,
        category.activeFrom ?? null,
        category.activeTo ?? null,
        now,
        category.id,
      ]
    );
  },

  async delete(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  },
};
