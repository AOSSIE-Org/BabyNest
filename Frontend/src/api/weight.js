/**
 * Weight tracking API module
 */

import { apiClient } from './client';

export const weightAPI = {
  getRecords: (userId) => apiClient.get(`/weight/${userId}`),
  
  addRecord: (weightData) => apiClient.post('/weight', weightData),
  
  updateRecord: (id, weightData) => apiClient.put(`/weight/${id}`, weightData),
  
  deleteRecord: (id) => apiClient.delete(`/weight/${id}`),
};
