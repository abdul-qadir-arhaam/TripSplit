import { apiClient } from '../../services/api';
import type { TripDashboardData } from './types';

export const dashboardApi = {
  getTripDashboard: async (tripId: string): Promise<TripDashboardData> => {
    const res = await apiClient.get<TripDashboardData>(`/trips/${tripId}/dashboard`);
    return res.data;
  },
};
