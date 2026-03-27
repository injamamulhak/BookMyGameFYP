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
    }
};

export default orderService;
