import axios from 'axios';

// API Base URLs
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://api.teamupindia.com/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Coach endpoints
  COACH: {
    LIST: '/coaches',
    DETAILS: '/coaches/:id',
    BOOKINGS: '/coaches/:id/bookings',
  },

  // Team endpoints
  TEAM: {
    LIST: '/teams',
    CREATE: '/teams',
    DETAILS: '/teams/:id',
    MEMBERS: '/teams/:id/members',
  },

  // Tournament endpoints
  TOURNAMENT: {
    LIST: '/tournaments',
    CREATE: '/tournaments',
    DETAILS: '/tournaments/:id',
    TEAMS: '/tournaments/:id/teams',
  },

  // Product endpoints
  PRODUCT: {
    LIST: '/products',
    DETAILS: '/products/:id',
    CATEGORIES: '/products/categories',
  },

  // Order endpoints
  ORDER: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAILS: '/orders/:id',
    TRACK: '/orders/:id/track',
  },

  // Delivery endpoints
  DELIVERY: {
    LIST: '/deliveries',
    DETAILS: '/deliveries/:id',
    UPDATE_STATUS: '/deliveries/:id/status',
  },
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
      }
    }
    return Promise.reject(error);
  }
); 