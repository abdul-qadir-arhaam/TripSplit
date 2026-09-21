export interface TripMember {
  id: string;
  trip_id: string;
  user_id?: string | null;
  display_name: string;
  member_type: 'REGISTERED' | 'GUEST';
  role: 'OWNER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE';
  joined_at: string;
  email?: string | null;
  profile_photo?: string | null;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget?: string | number | null;
  currency: string;
  trip_type: string;
  owner_id: string;
  status: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TripDetail extends Trip {
  members: TripMember[];
}

export interface TripCreatePayload {
  name: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  trip_type?: string;
  member_user_ids?: string[];
}

export interface TripUpdatePayload {
  name?: string;
  destination?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  trip_type?: string;
  status?: string;
}

export interface TripInviteInfo {
  id: string;
  name: string;
  destination: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  trip_type: string;
  owner_name: string;
  member_count: number;
  status: string;
}

export interface TripGuestJoinResponse {
  guest_token: string;
  member: TripMember;
  trip: TripDetail;
}

export interface TripGuestConvertPayload {
  email: string;
  password: string;
  name?: string;
}

export interface TripGuestConvertResponse {
  message: string;
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_photo?: string | null;
  };
  member: TripMember;
}

export interface GuestSession {
  tripId: string;
  memberId: string;
  displayName: string;
  token: string;
}

