import api from './api';
import { mockAuth } from '../mockData';

// Set to true for frontend-only testing without backend
const USE_MOCK_MODE = false;

const register = async (userData) => {
    if (USE_MOCK_MODE) {
        return await mockAuth.register(userData);
    }

    const response = await api.post('/auth/register', userData);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const login = async (email, password) => {
    if (USE_MOCK_MODE) {
        return await mockAuth.login(email, password);
    }

    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
};

export default authService;
