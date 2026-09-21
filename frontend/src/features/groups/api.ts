import { apiClient } from '../../services/api';
import type { Group, GroupDetail, GroupCreatePayload, GroupUpdatePayload } from './types';

export const groupsApi = {
  async getGroups(): Promise<Group[]> {
    const response = await apiClient.get<Group[]>('/groups');
    return response.data;
  },

  async createGroup(payload: GroupCreatePayload): Promise<Group> {
    const response = await apiClient.post<Group>('/groups', payload);
    return response.data;
  },

  async getGroupDetail(groupId: string): Promise<GroupDetail> {
    const response = await apiClient.get<GroupDetail>(`/groups/${groupId}`);
    return response.data;
  },

  async updateGroup(groupId: string, payload: GroupUpdatePayload): Promise<Group> {
    const response = await apiClient.patch<Group>(`/groups/${groupId}`, payload);
    return response.data;
  },

  async deleteGroup(groupId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/groups/${groupId}`);
    return response.data;
  },

  async addMember(groupId: string, userId: string): Promise<GroupDetail> {
    const response = await apiClient.post<GroupDetail>(`/groups/${groupId}/members`, { user_id: userId });
    return response.data;
  },

  async removeMember(groupId: string, userId: string): Promise<GroupDetail> {
    const response = await apiClient.delete<GroupDetail>(`/groups/${groupId}/members/${userId}`);
    return response.data;
  }
};
