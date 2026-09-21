import { apiClient } from '../../services/api';
import type { TripDetail, TripGuestJoinResponse } from '../trips/types';
import type {
  TripInvite,
  InvitePreview,
  InviteCreatePayload,
} from './types';

export const invitesApi = {
  /**
   * List all invite links created for a trip (Owner/member access).
   */
  async getTripInvites(tripId: string): Promise<TripInvite[]> {
    const response = await apiClient.get<TripInvite[]>(`/trips/${tripId}/invites`);
    return response.data;
  },

  /**
   * Get the active valid invite link for a trip, generating a default one if needed.
   */
  async getActiveTripInvite(tripId: string): Promise<TripInvite> {
    const response = await apiClient.get<TripInvite>(`/trips/${tripId}/invites/active`);
    return response.data;
  },

  /**
   * Generate a new cryptographically secure invite link for the trip.
   */
  async generateTripInvite(tripId: string, payload: InviteCreatePayload): Promise<TripInvite> {
    const response = await apiClient.post<TripInvite>(`/trips/${tripId}/invites`, payload);
    return response.data;
  },

  /**
   * Disable/revoke an invite link.
   */
  async disableTripInvite(tripId: string, inviteId: string): Promise<TripInvite> {
    const response = await apiClient.post<TripInvite>(`/trips/${tripId}/invites/${inviteId}/disable`);
    return response.data;
  },

  /**
   * Regenerate a fresh cryptographic token for an invite link.
   */
  async regenerateTripInvite(tripId: string, inviteId: string): Promise<TripInvite> {
    const response = await apiClient.post<TripInvite>(`/trips/${tripId}/invites/${inviteId}/regenerate`);
    return response.data;
  },

  /**
   * Public preview of invite details using the cryptographic token (No auth required).
   */
  async previewInvite(token: string): Promise<InvitePreview> {
    const response = await apiClient.get<InvitePreview>(`/invites/${token}`);
    return response.data;
  },

  /**
   * Join a trip as an authenticated registered user via invite token.
   */
  async joinViaToken(token: string): Promise<TripDetail> {
    const response = await apiClient.post<TripDetail>(`/invites/${token}/join`);
    return response.data;
  },

  /**
   * Join a trip as an anonymous guest with a display name via invite token.
   */
  async joinGuestViaToken(token: string, displayName: string): Promise<TripGuestJoinResponse> {
    const response = await apiClient.post<TripGuestJoinResponse>(`/invites/${token}/join-guest`, {
      display_name: displayName,
    });
    return response.data;
  },
};
