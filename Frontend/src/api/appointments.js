/**
 * Appointments API module
 */

import { apiClient } from './client';

export const appointmentsAPI = {
  getAll: () => apiClient.get('/appointments'),
  
  getById: (id) => apiClient.get(`/appointments/${id}`),
  
  create: (appointmentData) => apiClient.post('/appointments', appointmentData),
  
  update: (id, appointmentData) => apiClient.put(`/appointments/${id}`, appointmentData),
  
  delete: (id) => apiClient.delete(`/appointments/${id}`),
};
