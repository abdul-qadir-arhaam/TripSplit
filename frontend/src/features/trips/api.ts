import { apiClient } from '../../services/api';
import type { 
  Trip, 
  TripDetail, 
  TripCreatePayload, 
  TripUpdatePayload,
  TripInviteInfo,
  TripGuestJoinResponse,
  TripGuestConvertPayload,
  TripGuestConvertResponse,
} from './types';

export const tripsApi = {
  async getTrips(): Promise<Trip[]> {
    const response = await apiClient.get<Trip[]>('/trips');
    return response.data;
  },

  async createTrip(payload: TripCreatePayload): Promise<TripDetail> {
    const response = await apiClient.post<TripDetail>('/trips', payload);
    return response.data;
  },

  async getTripDetail(tripId: string): Promise<TripDetail> {
    const response = await apiClient.get<TripDetail>(`/trips/${tripId}`);
    return response.data;
  },

  async updateTrip(tripId: string, payload: TripUpdatePayload): Promise<TripDetail> {
    const response = await apiClient.patch<TripDetail>(`/trips/${tripId}`, payload);
    return response.data;
  },

  async deleteTrip(tripId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/trips/${tripId}`);
    return response.data;
  },

  async addMember(tripId: string, userId: string): Promise<TripDetail> {
    const response = await apiClient.post<TripDetail>(`/trips/${tripId}/members`, { user_id: userId });
    return response.data;
  },

  async removeMember(tripId: string, memberId: string): Promise<TripDetail> {
    const response = await apiClient.delete<TripDetail>(`/trips/${tripId}/members/${memberId}`);
    return response.data;
  },

  async getTripInviteInfo(tripId: string): Promise<TripInviteInfo> {
    const response = await apiClient.get<TripInviteInfo>(`/trips/${tripId}/invite`);
    return response.data;
  },

  async joinTrip(tripId: string): Promise<TripDetail> {
    const response = await apiClient.post<TripDetail>(`/trips/${tripId}/join`);
    return response.data;
  },

  async joinTripAsGuest(tripId: string, displayName: string): Promise<TripGuestJoinResponse> {
    const response = await apiClient.post<TripGuestJoinResponse>(`/trips/${tripId}/join-guest`, {
      display_name: displayName,
    });
    return response.data;
  },

  async addDirectGuestMember(tripId: string, displayName: string): Promise<TripDetail> {
    const response = await apiClient.post<TripDetail>(`/trips/${tripId}/members/guest`, {
      display_name: displayName,
    });
    return response.data;
  },

  async convertGuest(tripId: string, payload: TripGuestConvertPayload): Promise<TripGuestConvertResponse> {
    const response = await apiClient.post<TripGuestConvertResponse>(`/trips/${tripId}/convert-guest`, payload);
    return response.data;
  },

  async getGuestSession(tripId: string): Promise<{ member: TripDetail['members'][0]; trip_id: string; is_guest: boolean }> {
    const response = await apiClient.get(`/trips/${tripId}/guest-session`);
    return response.data;
  }
};

