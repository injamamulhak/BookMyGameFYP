const { body } = require('express-validator');

/**
 * Review Validators
 * Validation rules for review endpoints using express-validator
 */

const createReviewRules = [
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters'),
    body('venueId')
        .notEmpty().withMessage('Venue ID is required')
        .isUUID().withMessage('Invalid venue ID format'),
    body('bookingId')
        .optional()
        .isUUID().withMessage('Invalid booking ID format'),
];

module.exports = {
    createReviewRules,
};
