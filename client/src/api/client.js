import axios from 'axios';

export const STORAGE_KEY = 'ur_exam_auth_v1';

export function readStoredAuth() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredAuth(auth) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(STORAGE_KEY);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const auth = readStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const isVerifyCall = error.config?.url?.includes('/auth/verify');

    if (status === 401 && !isVerifyCall && readStoredAuth()) {
      clearStoredAuth();
      window.dispatchEvent(
        new CustomEvent('ur:auth-lost', {
          detail: {
            message:
              message ||
              'Your session ended. A registration number can only hold one active session at a time.',
            code: error.response?.data?.code,
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Check your connection.';
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the API is running on port 5000.';
  }
  return error?.message || fallback;
}

export default api;
