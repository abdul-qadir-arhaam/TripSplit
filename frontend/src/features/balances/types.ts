export interface MemberBalance {
  member_id: string;
  display_name: string;
  member_type: 'REGISTERED' | 'GUEST';
  user_id?: string | null;
  total_paid: string | number;
  total_share: string | number;
  settlement_paid?: string | number;
  settlement_received?: string | number;
  net_balance: string | number;
  status: 'OWES' | 'RECEIVES' | 'SETTLED';
}

export interface SettlementSuggestion {
  from_member_id: string;
  from_member_name: string;
  to_member_id: string;
  to_member_name: string;
  amount: string | number;
}

export interface TripBalanceSummary {
  trip_id: string;
  currency: string;
  total_spent: string | number;
  budget?: string | number | null;
  remaining_budget?: string | number | null;
  percentage_used?: string | number | null;
  is_balanced: boolean;
  balances: MemberBalance[];
  settlement_suggestions: SettlementSuggestion[];
}
