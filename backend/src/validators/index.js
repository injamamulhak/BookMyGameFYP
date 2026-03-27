/**
 * Validators Index - Central Export Point
 * Re-exports all validation rule sets for easy importing
 * 
 * Usage:
 *   const { authValidator, venueValidator } = require('../validators');
 */

const authValidator = require('./auth.validator');
const venueValidator = require('./venue.validator');
const bookingValidator = require('./booking.validator');
const reviewValidator = require('./review.validator');
const eventValidator = require('./event.validator');
const productValidator = require('./product.validator');

module.exports = {
    authValidator,
    venueValidator,
    bookingValidator,
    reviewValidator,
    eventValidator,
    productValidator,
};
