import { apiClient } from '../../services/api';
import type { AuthResponse, LoginPayload, RegisterPayload, User, UserUpdatePayload } from './types';

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async updateProfile(payload: UserUpdatePayload): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', payload);
    return response.data;
  },

  async checkHealth(): Promise<{ status: string }> {
    const response = await apiClient.get<{ status: string }>('/health');
    return response.data;
  }
};
