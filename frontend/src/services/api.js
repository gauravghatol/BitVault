import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// Wallet API
export const walletAPI = {
  getAll: (params) => api.get('/wallets', { params }),
  getById: (id) => api.get(`/wallets/${id}`),
  create: (data) => api.post('/wallets', data),
  update: (id, data) => api.put(`/wallets/${id}`, data),
  archive: (id) => api.delete(`/wallets/${id}`),
  verify: (id) => api.get(`/wallets/${id}/verify`),
  getStats: () => api.get('/wallets/stats')
};

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (txId) => api.get(`/transactions/${txId}`),
  create: (data) => api.post('/transactions', data),
  getByWallet: (walletId, params) => api.get(`/transactions/wallet/${walletId}`, { params }),
  verify: (txId) => api.get(`/transactions/${txId}/verify`),
  verifyChain: (walletId) => api.get(`/transactions/wallet/${walletId}/verify-chain`),
  getStats: () => api.get('/transactions/stats'),
  estimateFee: (priority) => api.get('/transactions/estimate-fee', { params: { priority } })
};

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
  getActivity: (days) => api.get('/dashboard/activity', { params: { days } }),
  getSecurity: () => api.get('/dashboard/security')
};
