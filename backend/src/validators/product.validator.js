const { body } = require('express-validator');

/**
 * Product Validators
 * Validation rules for product endpoints using express-validator
 */

const createProductRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .isLength({ max: 100 }).withMessage('Category must be under 100 characters'),
    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('description')
        .optional()
        .trim(),
    body('originalPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
];

const updateProductRules = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Category must be under 100 characters'),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('originalPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
];

module.exports = {
    createProductRules,
    updateProductRules,
};
