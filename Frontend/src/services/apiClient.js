// src/services/apiClient.js
import axios from "axios";
import Config from "react-native-config";

// Prefer environment variable from react-native-config, fall back to localhost
const API_BASE_URL = Config.API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token if available
apiClient.interceptors.request.use((config) => {
  try {
    const token = global.authToken || null; // adjust once you know how auth is stored
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // fail silently
  }
  return config;
});

// Log and forward errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error?.message || error);
    return Promise.reject(error);
  }
);

export default apiClient;
