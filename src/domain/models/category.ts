export type CategoryKind = 'expense' | 'income';
export type CategoryNature = 'fixed' | 'variable';

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  nature: CategoryNature;
  isBasic: boolean;
  isEnjoyment: boolean;
  color?: string;
  isActive: boolean;
  activeFrom?: string;
  activeTo?: string;
  createdAt: string;
  updatedAt: string;
};
