import axios from 'axios';
import toast from 'react-hot-toast';

let baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
if (baseURL && baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
  baseURL = `${baseURL.replace(/\/$/, '')}/api`;
}

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending the graxion_access_token cookie
});

// Request interceptor to attach access token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('graxion_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized — clear local state and redirect to auth
      if (window.location.pathname !== '/login') {
        window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${encodeURIComponent(window.location.href)}&product=mail`;
      }
    } else {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
