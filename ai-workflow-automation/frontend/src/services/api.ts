import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
        api.post('/auth/register', { email, password, name }),
    getMe: () => api.get('/auth/me'),
};

export const workflowAPI = {
    list: () => api.get('/workflows'),
    get: (id: string) => api.get(`/workflows/${id}`),
    create: (workflow: any) => api.post('/workflows', workflow),
    update: (id: string, workflow: any) => api.put(`/workflows/${id}`, workflow),
    delete: (id: string) => api.delete(`/workflows/${id}`),
    toggle: (id: string) => api.patch(`/workflows/${id}/toggle`),
    execute: (id: string, triggerData?: any) => api.post(`/workflows/${id}/execute`, { triggerData }),
};

export default api;
