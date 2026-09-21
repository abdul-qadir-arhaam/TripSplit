export interface User {
  id: string;
  name: string;
  email: string;
  profile_photo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserUpdatePayload {
  name?: string;
  profile_photo?: string | null;
}
