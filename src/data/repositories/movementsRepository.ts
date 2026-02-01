import { getDb } from '../db/sqlite';
import { Movement } from '../../domain/models';
import { monthRange } from '../../lib/date';

type MovementRow = Omit<Movement, 'shared'> & { shared: number };

const mapMovement = (row: MovementRow): Movement => ({
  ...row,
  shared: Boolean(row.shared),
});

export const MovementsRepository = {
  async listByMonth(date: Date) {
    const db = await getDb();
    const { start, end } = monthRange(date);
    const rows = await db.getAllAsync<MovementRow>(
      `SELECT * FROM movements
       WHERE date >= ? AND date <= ?
       ORDER BY date DESC, id DESC`,
      [start, end]
    );
    return rows.map(mapMovement);
  },

  async getById(id: string) {
    const db = await getDb();
    const row = await db.getFirstAsync<MovementRow>(
      'SELECT * FROM movements WHERE id = ?',
      [id]
    );
    return row ? mapMovement(row) : null;
  },

  async create(movement: Movement) {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO movements
        (id, date, amount, type, categoryId, description, paymentMethod, shared, sharedWith, expenseKind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        movement.date,
        movement.amount,
        movement.type,
        movement.categoryId,
        movement.description ?? null,
        movement.paymentMethod ?? null,
        movement.shared ? 1 : 0,
        movement.sharedWith ?? null,
        movement.expenseKind ?? null,
      ]
    );
  },

  async update(movement: Movement) {
    const db = await getDb();
    await db.runAsync(
      `UPDATE movements
       SET date = ?, amount = ?, type = ?, categoryId = ?, description = ?, paymentMethod = ?,
           shared = ?, sharedWith = ?, expenseKind = ?
       WHERE id = ?`,
      [
        movement.date,
        movement.amount,
        movement.type,
        movement.categoryId,
        movement.description ?? null,
        movement.paymentMethod ?? null,
        movement.shared ? 1 : 0,
        movement.sharedWith ?? null,
        movement.expenseKind ?? null,
        movement.id,
      ]
    );
  },

  async delete(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM movements WHERE id = ?', [id]);
  },
};
