import axios from 'axios';

// The API lives on the same computer as the website, on port 5000.
// Using the hostname the page was opened from (instead of a hard-coded
// "localhost") lets a phone on the same Wi-Fi reach it: on the phone,
// "localhost" would mean the phone itself, not the computer.
// To point somewhere else (tunnel / deployed server) set VITE_API_URL in frontend/.env
const API_URL: string =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_URL,
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
