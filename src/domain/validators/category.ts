import { z } from 'zod';

const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/, 'Formato esperado YYYY-MM');

const optionalMonthKey = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  monthKeySchema.optional()
);

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'El nombre es requerido'),
  kind: z.enum(['expense', 'income']),
  nature: z.enum(['fixed', 'variable']),
  isBasic: z.boolean(),
  isEnjoyment: z.boolean(),
  color: z.string().optional(),
  isActive: z.boolean(),
  activeFrom: optionalMonthKey,
  activeTo: optionalMonthKey,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const categoryFormSchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
