import api from './api';

const orderService = {
    // Create a new order
    createOrder(orderData) {
        return api.post('/orders', orderData);
    },

    // Get current user's orders
    getMyOrders() {
        return api.get('/orders/my-orders');
    },

    // Update user order (e.g. shipping address or cancel)
    updateMyOrder(id, data) {
        return api.put(`/orders/my-orders/${id}`, data);
    },

    // Get specific order details
    getOrderById(id) {
        return api.get(`/orders/${id}`);
    },

    // Admin: Get all orders
    getAllOrdersAdmin(params) {
        return api.get('/orders/admin/all', { params });
    },

    // Admin: Update order status
    updateOrderStatus(id, status) {
        return api.put(`/orders/${id}/status`, { status });
    },

    // Operator: Get operator's orders
    getOperatorOrders(params) {
        return api.get('/orders/operator/all', { params });
    },

    // Operator: Get specific order
    getOperatorOrderById(id) {
        return api.get(`/orders/operator/${id}`);
    },

    // Operator: Update order status
    updateOperatorOrderStatus(id, status) {
        return api.put(`/orders/operator/${id}/status`, { status });
    }
};

export default orderService;
