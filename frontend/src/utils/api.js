import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // Crucial for sending the graxion_access_token cookie
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized — clear local state and redirect to auth
      if (window.location.pathname !== '/login') {
        window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
      }
    } else {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
