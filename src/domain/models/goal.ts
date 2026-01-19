export type GoalPriority = 'low' | 'medium' | 'high';

export type Goal = {
  id: string;
  name: string;
  targetAmount?: number;
  targetDate?: string;
  currentAmount: number;
  priority: GoalPriority;
};
