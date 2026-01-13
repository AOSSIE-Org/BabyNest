import { apiClient } from './client';

export const profileApi = {
  get: () => apiClient('/get_profile'),
};
