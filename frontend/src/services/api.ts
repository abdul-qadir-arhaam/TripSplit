import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Inject JWT Bearer token into Authorization header (User token or Guest token)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userToken = localStorage.getItem('trip_auth_token');
    const guestToken = localStorage.getItem('trip_guest_token');
    const token = userToken || guestToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor: Handle 401 unauthorized gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('trip_auth_token');
        localStorage.removeItem('trip_auth_user');
        localStorage.removeItem('trip_guest_token');
        localStorage.removeItem('trip_guest_session');
      }
    }
    return Promise.reject(error);
  }
);
