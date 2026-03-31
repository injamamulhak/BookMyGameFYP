const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { auth } = require('../middleware/auth');
const { isAdmin, isOperator } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/order.validator');

// All order routes require authentication
router.use(auth);

// User Routes
router.post(
    '/',
    createOrderValidator,
    validate,
    orderController.createOrder
);

router.get(
    '/my-orders',
    orderController.getUserOrders
);

router.get(
    '/:id',
    orderController.getOrderById
);

router.put(
    '/my-orders/:id',
    orderController.updateMyOrder
);

// Operator Routes
router.get(
    '/operator/all',
    isOperator,
    orderController.getOperatorOrders
);

router.get(
    '/operator/:id',
    isOperator,
    orderController.getOperatorOrderById
);

router.put(
    '/operator/:id/status',
    isOperator,
    updateOrderStatusValidator,
    validate,
    orderController.updateOperatorOrderStatus
);

// Admin Routes
router.get(
    '/admin/all',
    isAdmin,
    orderController.getAllOrdersAdmin
);

router.put(
    '/:id/status',
    isAdmin,
    updateOrderStatusValidator,
    validate,
    orderController.updateOrderStatus
);

module.exports = router;
