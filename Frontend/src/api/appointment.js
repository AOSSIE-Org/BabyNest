import { apiClient } from './client';

export const appointmentsApi = {
  list: () => apiClient('/get_appointments'),
};
