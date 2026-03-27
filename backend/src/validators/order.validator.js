const { body } = require('express-validator');

// Validation rules for creating a new order
const createOrderValidator = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item.'),
    body('items.*.productId')
        .isUUID()
        .withMessage('Valid product ID is required for each item.'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1 for each item.'),
    body('shippingAddress')
        .notEmpty()
        .withMessage('Shipping address is required.')
        .isString()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Please provide a complete shipping address (at least 10 characters).')
];

// Validation rules for updating order status
const updateOrderStatusValidator = [
    body('status')
        .isIn(['pending', 'completed', 'cancelled'])
        .withMessage('Invalid order status. Allowed values: pending, completed, cancelled.')
];

module.exports = {
    createOrderValidator,
    updateOrderStatusValidator
};
