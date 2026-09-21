import type { User } from '../auth/types';

export interface FriendUser {
  id: string;
  name: string;
  email: string;
  profile_photo?: string | null;
  friendship_date: string;
}

export interface FriendRequestItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface PendingRequestsResponse {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}
