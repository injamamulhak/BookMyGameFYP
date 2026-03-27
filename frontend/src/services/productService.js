import apiClient from './api';

const productService = {
    // Public endpoints
    getAllProducts: (params = {}) => apiClient.get('/products', { params }),
    getProductById: (id) => apiClient.get(`/products/${id}`),
    getCategories: () => apiClient.get('/products/categories'),

    // Operator endpoints
    getMyProducts: () => apiClient.get('/products/seller/my-products'),
    getSellerStatus: () => apiClient.get('/products/seller/status'),
    requestSeller: () => apiClient.post('/products/seller/request'),

    // Admin/Operator CRUD
    createProduct: (formData) =>
        apiClient.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateProduct: (id, formData) =>
        apiClient.put(`/products/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),

    // Admin endpoints
    getAllProductsAdmin: (params = {}) => apiClient.get('/products/admin/all', { params }),
};

export default productService;
