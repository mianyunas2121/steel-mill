import axios from 'axios';

/**
 * Resolve API base URL for desktop, LAN mobile, and production.
 * On a phone, "localhost" is the phone itself — so when the page is opened via
 * a LAN IP (e.g. http://192.168.1.10:3000), we call the API on that same host:5000.
 */
function resolveApiUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return configured;
  }

  const pageHost = window.location.hostname;
  const isLocalPage =
    pageHost === 'localhost' || pageHost === '127.0.0.1' || pageHost === '[::1]';

  // Production / Vercel / custom domain: always use configured URL
  if (!isLocalPage && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
    return configured;
  }

  // Phone / tablet on same Wi‑Fi: replace localhost with the page hostname
  if (!isLocalPage) {
    try {
      const u = new URL(configured);
      u.hostname = pageHost;
      return u.origin;
    } catch {
      return `http://${pageHost}:5000`;
    }
  }

  return configured;
}

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  // Re-resolve on each request in case hostname differs (SSR vs client)
  if (typeof window !== 'undefined') {
    const live = resolveApiUrl();
    config.baseURL = `${live}/api`;
  }

  if (typeof window !== 'undefined') {
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
  if (!err.response) {
    const host =
      typeof window !== 'undefined' ? resolveApiUrl() : process.env.NEXT_PUBLIC_API_URL || 'API';
    return `Cannot reach server (${host}). On mobile, open the app via your PC's Wi‑Fi IP and keep the backend running.`;
  }
  return err.response?.data?.message || fallback;
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
