export type SettlementStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Settlement {
  id: string;
  trip_id: string;
  from_member_id: string;
  from_member_name: string;
  to_member_id: string;
  to_member_name: string;
  amount: string | number;
  currency: string;
  status: SettlementStatus;
  payment_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  created_by_member_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementCreate {
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency?: string;
  status: 'PENDING' | 'PAID';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export interface SettlementUpdate {
  status?: SettlementStatus;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export interface SettlementsSummary {
  total_settled_amount: string | number;
  total_pending_amount: string | number;
  settled_count: number;
  pending_count: number;
}

export interface SettlementListResponse {
  settlements: Settlement[];
  summary: SettlementsSummary;
}
