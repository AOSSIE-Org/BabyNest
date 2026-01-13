import { apiClient } from './client';

export const tasksApi = {
  list: () => apiClient('/get_tasks'),
};
