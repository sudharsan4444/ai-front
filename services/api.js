import axios from 'axios';

let envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8110/api';
// Ensure it ends with /api for the axios base, but we need the root for BASE_URL
if (!envApiUrl.endsWith('/api') && !envApiUrl.endsWith('/api/')) {
    envApiUrl = envApiUrl.endsWith('/') ? `${envApiUrl}api` : `${envApiUrl}/api`;
}

const API_URL = envApiUrl;
export const BASE_URL = API_URL.replace(/\/api$/, '').replace(/\/api\/$/, '');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export default api;
