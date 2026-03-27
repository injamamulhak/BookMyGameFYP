const { body } = require('express-validator');

/**
 * Venue Validators
 * Validation rules for venue endpoints using express-validator
 */

const createVenueRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Venue name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Venue name must be between 2 and 255 characters'),
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required'),
    body('pricePerHour')
        .notEmpty().withMessage('Price per hour is required')
        .isFloat({ min: 0 }).withMessage('Price per hour must be a positive number'),
    body('sportId')
        .notEmpty().withMessage('Sport is required')
        .isUUID().withMessage('Invalid sport ID format'),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('City must be under 100 characters'),
    body('state')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('State must be under 100 characters'),
    body('postalCode')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Postal code must be under 20 characters'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('contactPhone')
        .optional()
        .trim(),
    body('contactEmail')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid contact email format'),
];

const updateVenueRules = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Venue name must be between 2 and 255 characters'),
    body('pricePerHour')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price per hour must be a positive number'),
    body('sportId')
        .optional()
        .isUUID().withMessage('Invalid sport ID format'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('contactEmail')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid contact email format'),
];

module.exports = {
    createVenueRules,
    updateVenueRules,
};
