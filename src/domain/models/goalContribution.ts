export type GoalContribution = {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string | null;
  createdAt: string;
};
