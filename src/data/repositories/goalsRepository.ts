import { getDb } from '../db/sqlite';
import { Goal } from '../../domain/models';

export const GoalsRepository = {
  async list() {
    const db = await getDb();
    return db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY name ASC');
  },

  async create(goal: Goal) {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO goals (id, name, targetAmount, targetDate, currentAmount, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.name,
        goal.targetAmount ?? null,
        goal.targetDate ?? null,
        goal.currentAmount,
        goal.priority,
      ]
    );
  },

  async update(goal: Goal) {
    const db = await getDb();
    await db.runAsync(
      `UPDATE goals
       SET name = ?, targetAmount = ?, targetDate = ?, currentAmount = ?, priority = ?
       WHERE id = ?`,
      [
        goal.name,
        goal.targetAmount ?? null,
        goal.targetDate ?? null,
        goal.currentAmount,
        goal.priority,
        goal.id,
      ]
    );
  },

  async delete(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  },
};
