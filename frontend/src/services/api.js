import axios from 'axios';

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

export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const getProducts = () => apiClient.get('/products');
export const addProduct = (productData) => apiClient.post('/products', productData);
export const updateQuantity = (id, newQuantity, oldQuantity) =>
    apiClient.patch(`/products/${id}/quantite`, { quantite_stock: newQuantity, ancienne_quantite: oldQuantity });
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
export const getProductHistory = (id) => apiClient.get(`/products/${id}/history`);