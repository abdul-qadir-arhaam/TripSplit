import { apiClient } from '../../services/api';
import type {
  Expense,
  ExpenseDetail,
  ExpenseCreate,
  ExpenseUpdate,
} from './types';

export interface ExpenseFilterParams {
  category?: string;
  payer_id?: string;
  search?: string;
  sort_by?: 'date' | 'amount' | 'created_at';
  order?: 'asc' | 'desc';
}

export const expensesApi = {
  async getExpenses(tripId: string, params?: ExpenseFilterParams): Promise<Expense[]> {
    const response = await apiClient.get<Expense[]>(`/trips/${tripId}/expenses`, { params });
    return response.data;
  },

  async getExpenseDetail(tripId: string, expenseId: string): Promise<ExpenseDetail> {
    const response = await apiClient.get<ExpenseDetail>(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },

  async createExpense(tripId: string, payload: ExpenseCreate): Promise<ExpenseDetail> {
    const response = await apiClient.post<ExpenseDetail>(`/trips/${tripId}/expenses`, payload);
    return response.data;
  },

  async updateExpense(tripId: string, expenseId: string, payload: ExpenseUpdate): Promise<ExpenseDetail> {
    const response = await apiClient.patch<ExpenseDetail>(`/trips/${tripId}/expenses/${expenseId}`, payload);
    return response.data;
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },
};
