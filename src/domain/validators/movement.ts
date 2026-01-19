import { isValid } from 'date-fns';
import { z } from 'zod';
import { parseISODate } from '../../lib/date';

const dateStringSchema = z
  .string()
  .min(1)
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Fecha invalida',
  })
  .refine((value) => isValid(parseISODate(value)), {
    message: 'Fecha invalida',
  });

export const movementFormSchema = z.object({
  date: dateStringSchema,
  amount: z
    .string()
    .min(1, 'El monto es requerido')
    .refine((value) => !Number.isNaN(Number(value.replace(',', '.'))), {
      message: 'El monto debe ser numerico',
    })
    .transform((value) => Number(value.replace(',', '.')))
    .refine((value) => value > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'La categoria es requerida'),
  description: z.string().trim().optional(),
});

export const movementSchema = movementFormSchema.extend({
  id: z.string().min(1),
  paymentMethod: z.string().trim().optional(),
  shared: z.boolean().default(false),
  sharedWith: z.string().trim().optional(),
  expenseKind: z.enum(['fixed', 'variable', 'unusual']).optional(),
});

export type MovementFormValues = z.output<typeof movementFormSchema>;
export type MovementFormInput = z.input<typeof movementFormSchema>;
