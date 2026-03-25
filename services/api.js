import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8110/api';
export const BASE_URL = API_URL.replace(/\/api$/, '');

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
