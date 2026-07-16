import axios from 'axios';

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isPrivateLanHost(hostname) {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isLocalApiUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
}

/**
 * Client API base:
 * - Vercel / public domain → same-origin `/api/proxy` (server forwards to Railway via API_URL)
 * - LAN IP phone → PC IP:5000
 * - localhost → NEXT_PUBLIC_API_URL / localhost:5000
 */
function resolveClientApiBase() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return `${configured}/api`;
  }

  const pageHost = window.location.hostname;

  // Production (any phone worldwide): use Vercel proxy → Railway
  if (!isLocalHost(pageHost) && !isPrivateLanHost(pageHost)) {
    return '/api/proxy';
  }

  // Phone on same Wi‑Fi as laptop
  if (isPrivateLanHost(pageHost) && isLocalApiUrl(configured)) {
    return `http://${pageHost}:5000/api`;
  }

  return `${configured}/api`;
}

const api = axios.create({
  baseURL: resolveClientApiBase(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = resolveClientApiBase();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Human-readable message for login / network failures */
export function getApiErrorMessage(err, fallback = 'Request failed') {
  if (!err) return fallback;
  if (err.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';

  const serverMsg = err.response?.data?.message;
  if (serverMsg) return serverMsg;

  if (!err.response) {
    const pageHost = typeof window !== 'undefined' ? window.location.hostname : '';
    if (pageHost && !isLocalHost(pageHost) && !isPrivateLanHost(pageHost)) {
      return 'Cannot reach API. On Vercel set API_URL to your Railway URL (https://xxxx.up.railway.app) and redeploy.';
    }
    if (isPrivateLanHost(pageHost)) {
      return 'Cannot reach laptop API. Keep backend running and use http://YOUR_PC_IP:3000 on the phone.';
    }
    return 'Cannot reach server. Start the backend on port 5000.';
  }

  return fallback;
}

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getProfile = () => api.get('/auth/profile');
export const changePassword = (data) => api.post('/auth/change-password', data);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Customers
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const getCustomerTransactions = (id) => api.get(`/customers/${id}/transactions`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createIncoming = (data) => api.post('/transactions/incoming', data);
export const createOutgoing = (data) => api.post('/transactions/outgoing', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getInvoice = (invoiceNumber) => api.get(`/transactions/invoice/${invoiceNumber}`);

// Inventory
export const getInventory = () => api.get('/inventory');
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const getInventoryTrend = () => api.get('/inventory/trend');

// Pricing
export const getPricing = (params) => api.get('/pricing', { params });
export const createPricing = (data) => api.post('/pricing', data);
export const updatePricing = (id, data) => api.put(`/pricing/${id}`, data);

// Payments
export const getPayments = (params) => api.get('/payments', { params });
export const createPayment = (data) => api.post('/payments', data);

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const resetUserPassword = (id, data) => api.post(`/users/${id}/reset-password`, data);

// Reports
export const getDailyReport = (date) => api.get('/reports/daily', { params: { date } });
export const getMonthlyReport = (month) => api.get('/reports/monthly', { params: { month } });
export const getCustomerReport = (id) => api.get(`/reports/customer/${id}`);
export const getMaterialReport = (params) => api.get('/reports/material', { params });
export const exportReport = (params) =>
  api.get('/reports/export', { params, responseType: 'blob' });

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const exportAllData = () => api.get('/export-data');
