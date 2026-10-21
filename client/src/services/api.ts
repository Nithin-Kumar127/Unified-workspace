// client/src/services/api.ts
import axios from 'axios';

// Create a custom Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// ── DEBUG: Log every outgoing request ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Safely build full URL — config.baseURL and config.url are both potentially undefined
    const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
    console.log(`[API DEBUG] -> ${config.method?.toUpperCase() ?? 'GET'} ${fullUrl}`);
    console.log(
      '[API DEBUG] Headers:',
      JSON.stringify(config.headers, (key, value) =>
        key.toLowerCase() === 'authorization' ? '[REDACTED]' : value
      )
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;