import { z } from 'zod';

export const goalFormSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  targetAmount: z.number().nonnegative().optional(),
  targetDate: z.string().optional(),
  currentAmount: z.number().nonnegative(),
  priority: z.enum(['low', 'medium', 'high']),
  quickAmount1: z.number().nonnegative().optional(),
  quickAmount2: z.number().nonnegative().optional(),
  quickAmount3: z.number().nonnegative().optional(),
});

export const goalSchema = goalFormSchema.extend({
  id: z.string().min(1),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;
