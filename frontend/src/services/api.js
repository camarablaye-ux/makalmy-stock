import axios from 'axios';
import { addToQueue, processQueue } from './syncManager';

const apiBaseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

const apiClient = axios.create({
    baseURL: apiBaseUrl,
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response && error.config) {
            // Network error (offline or server down)
            const method = error.config.method?.toLowerCase();
            if (['post', 'put', 'patch', 'delete'].includes(method) && !error.config.url.includes('/auth/login')) {
                addToQueue({
                    url: error.config.url,
                    method: error.config.method,
                    data: typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data
                });
                return Promise.resolve({ data: { offline: true, message: 'Mis en file d\'attente' } });
            }
        }
        return Promise.reject(error);
    }
);

window.addEventListener('online', () => {
    processQueue(apiClient);
});

export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const register = (credentials) => apiClient.post('/auth/register', credentials);
export const getProducts = () => apiClient.get('/products');
export const addProduct = (productData) => apiClient.post('/products', productData);
export const updateQuantity = (id, newQuantity, oldQuantity) =>
    apiClient.patch(`/products/${id}/quantite`, { quantite_stock: newQuantity, ancienne_quantite: oldQuantity });
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
export const getProductHistory = (id) => apiClient.get(`/products/${id}/history`);

// Finances API
export const getFinances = () => apiClient.get('/finances');
export const addFinance = (data) => apiClient.post('/finances', data);
export const deleteFinance = (id) => apiClient.delete(`/finances/${id}`);
export const getFinanceBilan = () => apiClient.get('/finances/bilan');

// Analytics API (Business Intelligence)
export const getAnalyticsCA = () => apiClient.get('/analytics/ca-evolution');
export const getAnalyticsTopProducts = () => apiClient.get('/analytics/top-produits');
export const getAnalyticsMarge = () => apiClient.get('/analytics/marge');

// Investissements API
export const getInvestissements = () => apiClient.get('/investissements');
export const getInvestResume = () => apiClient.get('/investissements/resume');
export const addInvestissement = (data) => apiClient.post('/investissements', data);
export const deleteInvestissement = (id) => apiClient.delete(`/investissements/${id}`);

// Fournisseurs API
export const getFournisseurs = () => apiClient.get('/fournisseurs');
export const addFournisseur = (data) => apiClient.post('/fournisseurs', data);
export const deleteFournisseur = (id) => apiClient.delete(`/fournisseurs/${id}`);

// Sécurité API
export const changePassword = (data) => apiClient.post('/auth/change-password', data);

// Gestion des employés API
export const getEmployes = () => apiClient.get('/auth/employes');
export const createEmploye = (data) => apiClient.post('/auth/employes', data);
export const deleteEmploye = (id) => apiClient.delete(`/auth/employes/${id}`);

// Menus & Recettes API
export const getMenus = () => apiClient.get('/menus');
export const createMenu = (data) => apiClient.post('/menus', data);
export const deleteMenu = (id) => apiClient.delete(`/menus/${id}`);
export const sellMenu = (id, quantite = 1) => apiClient.post(`/menus/${id}/vendre`, { quantite });
