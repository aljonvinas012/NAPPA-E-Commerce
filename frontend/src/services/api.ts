import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nappa_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nappa_token');
      localStorage.removeItem('nappa_user');
    }
    return Promise.reject(error);
  }
);

// Product images live in frontend/public/images (seeded photos and admin
// uploads both land there), so Vite already serves them at this same path —
// no need to point at the backend host.
export const getImageUrl = (path?: string) => {
  if (!path) return '/images/logo.png';
  return path;
};

export default api;
