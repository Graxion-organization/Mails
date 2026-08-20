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

// Request interceptor — attach Bearer token from localStorage
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

// Response interceptor — handle errors WITHOUT auto-redirecting on 401
// The redirect-to-auth logic is now exclusively handled by RequireAuth in App.jsx
// This prevents the infinite redirect loop that was happening before
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the stale token so AuthContext/RequireAuth can detect unauthenticated state
      localStorage.removeItem('graxion_access_token');
      // Do NOT redirect here — let React handle it via state
    } else {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
