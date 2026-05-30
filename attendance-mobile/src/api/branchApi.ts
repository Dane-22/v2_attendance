import apiClient from './client';
import { ApiResponse } from '../types/api';
import { BranchEmployee, BranchSummary } from '../types';

export const branchApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<BranchSummary[]>>('/branches');
    return response.data.data;
  },

  getEmployees: async (branchCode: string) => {
    const response = await apiClient.get<ApiResponse<BranchEmployee[]>>(`/branches/${branchCode}/employees`);
    return response.data.data;
  },
};
