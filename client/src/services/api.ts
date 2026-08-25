// client/src/services/api.ts
import axios from 'axios';

// Create a custom Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Intercept requests and attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;