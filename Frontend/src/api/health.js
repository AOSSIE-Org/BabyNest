/**
 * Health metrics API module
 */

import { apiClient } from './client';

export const healthAPI = {
  getMetrics: (userId) => apiClient.get(`/health/${userId}`),
  
  updateMetrics: (userId, healthData) => apiClient.put(`/health/${userId}`, healthData),
  
  getHistory: (userId, startDate, endDate) => 
    apiClient.get(`/health/${userId}/history?start=${startDate}&end=${endDate}`),
};
