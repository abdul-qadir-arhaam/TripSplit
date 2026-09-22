import type { SettlementsSummary } from '../settlements/types';

export interface FinancialMetrics {
  total_budget?: string | number | null;
  total_spent: string | number;
  remaining_budget?: string | number | null;
  percentage_used?: string | number | null;
  budget_status: 'ON_TRACK' | 'CAUTION' | 'OVER_BUDGET' | 'NO_BUDGET';
  average_per_person: string | number;
  average_daily_spend: string | number;
  remaining_daily_budget?: string | number | null;
  total_days?: number | null;
  days_elapsed?: number | null;
  days_remaining?: number | null;
}

export interface CategorySpend {
  category: string;
  amount: string | number;
  percentage: string | number;
  count: number;
}

export interface DailySpend {
  date: string;
  amount: string | number;
  count: number;
}

export interface MemberSpendSummary {
  member_id: string;
  display_name: string;
  member_type: 'REGISTERED' | 'GUEST';
  total_paid: string | number;
  total_share: string | number;
  net_balance: string | number;
  percentage_of_total_paid: string | number;
}

export interface TopExpenseItem {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  category: string;
  paid_by_name: string;
  expense_date: string;
}

export interface TripDashboardData {
  trip_id: string;
  trip_name: string;
  destination: string;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  member_count: number;
  financials: FinancialMetrics;
  category_breakdown: CategorySpend[];
  daily_trends: DailySpend[];
  member_contributions: MemberSpendSummary[];
  largest_expenses: TopExpenseItem[];
  recent_expenses: TopExpenseItem[];
  settlements_summary: SettlementsSummary;
}
