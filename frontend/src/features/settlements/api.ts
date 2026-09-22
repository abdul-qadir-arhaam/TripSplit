import { apiClient } from '../../services/api';
import type {
  Settlement,
  SettlementCreate,
  SettlementUpdate,
  SettlementListResponse,
} from './types';

export const settlementsApi = {
  recordSettlement: async (tripId: string, data: SettlementCreate): Promise<Settlement> => {
    const res = await apiClient.post<Settlement>(`/trips/${tripId}/settlements`, data);
    return res.data;
  },

  listSettlements: async (tripId: string, status?: string): Promise<SettlementListResponse> => {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await apiClient.get<SettlementListResponse>(`/trips/${tripId}/settlements`, { params });
    return res.data;
  },

  getSettlement: async (tripId: string, settlementId: string): Promise<Settlement> => {
    const res = await apiClient.get<Settlement>(`/trips/${tripId}/settlements/${settlementId}`);
    return res.data;
  },

  updateSettlement: async (
    tripId: string,
    settlementId: string,
    data: SettlementUpdate
  ): Promise<Settlement> => {
    const res = await apiClient.patch<Settlement>(`/trips/${tripId}/settlements/${settlementId}`, data);
    return res.data;
  },

  deleteSettlement: async (tripId: string, settlementId: string): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/settlements/${settlementId}`);
  },
};
