import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
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

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const stationAPI = {
  // Station operations
  getAll: () => api.get('/stations'),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post('/stations', data),
  update: (id, data) => api.put(`/stations/${id}`, data),
  delete: (id) => api.delete(`/stations/${id}`),
  
  // Station specific operations
  startCharging: (id) => api.post(`/stations/${id}/start`),
  stopCharging: (id) => api.post(`/stations/${id}/stop`),
  getStatus: (id) => api.get(`/stations/${id}/status`),
};

export const ocppAPI = {
  // OCPP specific operations
  sendCommand: (stationId, command, payload) => 
    api.post(`/ocpp/${stationId}/command`, { command, payload }),
  
  // WebSocket connection management
  connect: (stationId, url) => 
    api.post(`/ocpp/${stationId}/connect`, { url }),
  
  disconnect: (stationId) => 
    api.post(`/ocpp/${stationId}/disconnect`),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => api.post('/auth/logout'),
};

export default api;
