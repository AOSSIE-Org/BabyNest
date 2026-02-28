import {BASE_URL} from '@env';

const request = async (endpoint, options = {}, retries = 1) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {'Content-Type': 'application/json'},
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Request failed');
    }

    return res.json();
  } catch (err) {
    if (retries > 0) {
      console.warn(
        `Retrying request to ${endpoint}, attempts left: ${retries}`,
      );
      return request(endpoint, options, retries - 1);
    }
    throw err;
  } finally {

    clearTimeout(timeout);
  }
};

export const weightApi = {
  getAll: () => request('/weight', {}, 2),
  create: data =>
    request('/weight', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/weight/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: id =>
    request(`/weight/${id}`, {
      method: 'DELETE',
    }),
};
