import axios from 'axios';
import toast from 'react-hot-toast';

let baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
if (baseURL && baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
  baseURL = `${baseURL.replace(/\/$/, '')}/api`;
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Request interceptor — can be used for other headers if needed in the future
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid cookie
      const authUrl = import.meta.env.VITE_AUTH_URL || 'https://accounts.graxion.in';
      window.location.href = `${authUrl}/login?redirect_to=${encodeURIComponent(window.location.origin)}&product=mail`;
    } else {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
