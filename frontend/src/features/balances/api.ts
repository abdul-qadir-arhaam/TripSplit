import { apiClient } from '../../services/api';
import type { TripBalanceSummary } from './types';

export const balancesApi = {
  async getTripBalances(tripId: string): Promise<TripBalanceSummary> {
    const response = await apiClient.get<TripBalanceSummary>(`/trips/${tripId}/balances`);
    return response.data;
  },
};
