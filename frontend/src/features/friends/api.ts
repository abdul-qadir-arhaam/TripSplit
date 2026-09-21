import { apiClient } from '../../services/api';
import type { User } from '../auth/types';
import type { FriendUser, FriendRequestItem, PendingRequestsResponse } from './types';

export const friendsApi = {
  async getFriends(): Promise<FriendUser[]> {
    const response = await apiClient.get<FriendUser[]>('/friends');
    return response.data;
  },

  async getRequests(): Promise<PendingRequestsResponse> {
    const response = await apiClient.get<PendingRequestsResponse>('/friends/requests');
    return response.data;
  },

  async sendRequest(receiver_id: string): Promise<FriendRequestItem> {
    const response = await apiClient.post<FriendRequestItem>('/friends/requests', { receiver_id });
    return response.data;
  },

  async acceptRequest(request_id: string): Promise<FriendRequestItem> {
    const response = await apiClient.post<FriendRequestItem>(`/friends/requests/${request_id}/accept`);
    return response.data;
  },

  async declineRequest(request_id: string): Promise<FriendRequestItem> {
    const response = await apiClient.post<FriendRequestItem>(`/friends/requests/${request_id}/decline`);
    return response.data;
  },

  async removeFriend(friend_user_id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/friends/${friend_user_id}`);
    return response.data;
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) return [];
    const response = await apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query.trim())}`);
    return response.data;
  }
};
