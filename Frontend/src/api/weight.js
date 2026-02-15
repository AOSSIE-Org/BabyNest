import { apiClient } from './client';

export const weightApi = {
  list: () => apiClient('/weight'),
  create: data =>
    apiClient('/weight', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiClient(`/weight/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: id =>
    apiClient(`/weight/${id}`, { method: 'DELETE' }),
};
