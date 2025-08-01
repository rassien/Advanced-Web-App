import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'Bir hata oluştu';
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
    } else if (error.response?.status === 403) {
      toast.error('Bu işlem için yetkiniz yok.');
    } else if (error.response?.status === 404) {
      toast.error('İstenilen kaynak bulunamadı.');
    } else if (error.response?.status >= 500) {
      toast.error('Server hatası. Lütfen daha sonra tekrar deneyin.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
};

// Employees API
export const employeesAPI = {
  getAll: () => api.get('/calisanlar'),
  getById: (id) => api.get(`/calisanlar/${id}`),
  create: (data) => api.post('/calisanlar', data),
  update: (id, data) => api.put(`/calisanlar/${id}`, data),
  delete: (id) => api.delete(`/calisanlar/${id}`),
  bulkCreate: (employees) => api.post('/calisanlar/bulk', { employees }),
  getNearestBranches: (id, n = 5) => api.get(`/calisanlar/${id}/en-yakin-subeler?n=${n}`),
};

// Branches API
export const branchesAPI = {
  getAll: () => api.get('/subeler'),
  getById: (id) => api.get(`/subeler/${id}`),
  create: (data) => api.post('/subeler', data),
  update: (id, data) => api.put(`/subeler/${id}`, data),
  delete: (id) => api.delete(`/subeler/${id}`),
  bulkCreate: (branches) => api.post('/subeler/bulk', { branches }),
};

// Assignments API
export const assignmentsAPI = {
  getAll: () => api.get('/atamalar'),
  getById: (id) => api.get(`/atamalar/${id}`),
  create: (data) => api.post('/atamalar', data),
  delete: (id) => api.delete(`/atamalar/${id}`),
  getByEmployee: (employeeId) => api.get(`/atamalar/calisan/${employeeId}`),
  bulkOptimize: (data) => api.post('/atamalar/bulk-optimize', data),
};

// File upload utility
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Excel processing utility
export const processExcelData = (data, mappings) => {
  return data.map(row => {
    const processedRow = {};
    Object.keys(mappings).forEach(key => {
      const excelColumn = mappings[key];
      processedRow[key] = row[excelColumn] || '';
    });
    return processedRow;
  });
};

export default api;