const { body, oneOf } = require('express-validator');

/**
 * Booking Validators
 * Validation rules for booking endpoints using express-validator
 */

const createBookingRules = [
    // Either slotId OR (venueId + date + startTime + endTime) must be provided
    oneOf(
        [
            body('slotId').notEmpty().isUUID(),
            [
                body('venueId').notEmpty().isUUID(),
                body('date').notEmpty().isISO8601(),
                body('startTime').notEmpty(),
                body('endTime').notEmpty(),
            ],
        ],
        { message: 'Either slotId or (venueId, date, startTime, endTime) is required' }
    ),
    body('totalPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

module.exports = {
    createBookingRules,
};
