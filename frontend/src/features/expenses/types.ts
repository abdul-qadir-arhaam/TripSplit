export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Fuel'
  | 'Stay'
  | 'Activities'
  | 'Tickets'
  | 'Shopping'
  | 'Drinks'
  | 'Emergency'
  | 'Miscellaneous';

export interface SplitItemInput {
  member_id: string;
  amount?: number | string;
  percentage?: number | string;
  shares?: number | string;
}

export interface ExpenseCreate {
  title: string;
  amount: number;
  currency?: string;
  category?: string;
  paid_by_member_id: string;
  split_method: SplitMethod;
  expense_date?: string;
  location_name?: string;
  notes?: string;
  receipt_url?: string;
  splits?: SplitItemInput[];
}

export interface ExpenseUpdate {
  title?: string;
  amount?: number;
  currency?: string;
  category?: string;
  paid_by_member_id?: string;
  split_method?: SplitMethod;
  expense_date?: string;
  location_name?: string;
  notes?: string;
  receipt_url?: string;
  splits?: SplitItemInput[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount: string | number;
  split_value?: string | number | null;
  member_display_name: string;
  member_type: 'REGISTERED' | 'GUEST';
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: string | number;
  currency: string;
  category: string;
  paid_by_member_id: string;
  paid_by_name: string;
  split_method: SplitMethod;
  expense_date: string;
  location_name?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_by_member_id?: string | null;
  created_at: string;
  updated_at: string;
  split_count: number;
}

export interface ExpenseDetail extends Expense {
  splits: ExpenseSplit[];
}
