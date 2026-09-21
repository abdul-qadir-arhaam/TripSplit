export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  profile_photo?: string | null;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupCreatePayload {
  name: string;
}

export interface GroupUpdatePayload {
  name: string;
}
