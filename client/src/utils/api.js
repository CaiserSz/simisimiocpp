import axios from 'axios';
import { toast } from 'react-toastify';
import { getToken, clearToken } from './auth';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = getToken();
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
  (response) => {
    // Handle successful responses
    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      // Handle specific status codes
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        clearToken();
        window.location.href = '/login';
      }
      
      // Show error message from server or fallback to default message
      const errorMessage = data?.error || data?.message || 'An error occurred';
      toast.error(errorMessage);
      
      return Promise.reject({
        status,
        message: errorMessage,
        ...data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error(error.message || 'An error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // Create a blob URL for the file
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Helper function to handle file uploads
export const uploadFile = async (url, file, fieldName = 'file', onUploadProgress) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }
  
  const response = await api.post(url, formData, config);
  return response.data;
};

export default api;
