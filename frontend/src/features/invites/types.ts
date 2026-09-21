export interface TripInvite {
  id: string;
  trip_id: string;
  code: string;
  token?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  use_count: number;
  is_active: boolean;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  is_expired?: boolean;
}

export interface InvitePreview {
  trip_id: string;
  name: string;
  destination: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  trip_type: string;
  owner_name: string;
  member_count: number;
  is_valid: boolean;
  is_expired: boolean;
  is_active: boolean;
  expires_at?: string | null;
  max_uses?: number | null;
  use_count: number;
}

export interface InviteCreatePayload {
  expires_in_days?: number | null;
  max_uses?: number | null;
  require_approval?: boolean;
}

export interface InviteGuestJoinPayload {
  display_name: string;
}
