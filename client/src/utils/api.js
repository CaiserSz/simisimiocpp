/**
 * API Client
 * Axios-based API client with interceptors
 * 
 * Created: 2025-01-11
 * Purpose: Centralized API communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
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

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// API methods
export const api = {
  // Auth
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (userData) =>
    apiClient.post('/auth/register', userData),
  logout: () =>
    apiClient.post('/auth/logout'),

  // Simulator
  get: (endpoint) => apiClient.get(endpoint),
  post: (endpoint, data) => apiClient.post(endpoint, data),
  put: (endpoint, data) => apiClient.put(endpoint, data),
  delete: (endpoint) => apiClient.delete(endpoint),

  // Stations
  getStations: () =>
    apiClient.get('/simulator/stations'),
  createStation: (stationData) =>
    apiClient.post('/simulator/stations', stationData),
  startStation: (stationId) =>
    apiClient.put(`/simulator/stations/${stationId}/start`),
  stopStation: (stationId) =>
    apiClient.put(`/simulator/stations/${stationId}/stop`),
  deleteStation: (stationId) =>
    apiClient.delete(`/simulator/stations/${stationId}`),

  // Dashboard
  getDashboard: () =>
    apiClient.get('/dashboard/overview'),
  getMetrics: () =>
    apiClient.get('/dashboard/metrics'),
};

