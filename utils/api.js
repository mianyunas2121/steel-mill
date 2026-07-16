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
 * Resolve API base URL.
 * - Local / Vercel: use NEXT_PUBLIC_API_URL as-is (default http://localhost:5000)
 * - Phone on Wi‑Fi via LAN IP only: rewrite localhost → that IP so the phone hits the PC
 * Never rewrite production hosts like *.vercel.app
 */
function resolveApiUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return configured;
  }

  const pageHost = window.location.hostname;

  // Only for LAN testing from a phone/tablet (e.g. http://192.168.1.164:3000)
  if (isPrivateLanHost(pageHost) && isLocalApiUrl(configured)) {
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

const api = axios.create({
  baseURL: `${resolveApiUrl()}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = `${resolveApiUrl()}/api`;
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
    const apiHost = typeof window !== 'undefined' ? resolveApiUrl() : 'API';
    const pageHost = typeof window !== 'undefined' ? window.location.hostname : '';

    if (pageHost && !isLocalHost(pageHost) && !isPrivateLanHost(pageHost) && isLocalApiUrl(apiHost)) {
      return 'Backend not configured for this site. Set NEXT_PUBLIC_API_URL on Vercel to your live API URL (Railway/Render), or use http://localhost:3000 with the backend running.';
    }

    if (isPrivateLanHost(pageHost)) {
      return `Cannot reach server (${apiHost}). Keep the backend running on your PC and open the app via your PC Wi‑Fi IP.`;
    }

    return `Cannot reach server (${apiHost}). Start the backend on port 5000, or check NEXT_PUBLIC_API_URL.`;
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
