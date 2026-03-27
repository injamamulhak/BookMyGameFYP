const { body } = require('express-validator');

/**
 * Event Validators
 * Validation rules for event endpoints using express-validator
 */

const createEventRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Event title is required')
        .isLength({ min: 2, max: 255 }).withMessage('Title must be between 2 and 255 characters'),
    body('venueId')
        .notEmpty().withMessage('Venue is required')
        .isUUID().withMessage('Invalid venue ID format'),
    body('eventType')
        .notEmpty().withMessage('Event type is required')
        .isIn(['tournament', 'league', 'training']).withMessage('Event type must be tournament, league, or training'),
    body('startDate')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('Invalid end date format'),
    body('registrationFee')
        .optional()
        .isFloat({ min: 0 }).withMessage('Registration fee must be a positive number'),
    body('maxParticipants')
        .optional()
        .isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
    body('description')
        .optional()
        .trim(),
];

const updateEventRules = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Title must be between 2 and 255 characters'),
    body('eventType')
        .optional()
        .isIn(['tournament', 'league', 'training']).withMessage('Event type must be tournament, league, or training'),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    body('registrationFee')
        .optional()
        .isFloat({ min: 0 }).withMessage('Registration fee must be a positive number'),
    body('maxParticipants')
        .optional()
        .isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
];

module.exports = {
    createEventRules,
    updateEventRules,
};
