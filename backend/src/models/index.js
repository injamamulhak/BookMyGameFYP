/**
 * Models Index - Central Export Point
 * Re-exports all Prisma query helper models for easy importing
 * 
 * Usage:
 *   const { UserModel, VenueModel } = require('../models');
 */

const UserModel = require('./user.model');
const VenueModel = require('./venue.model');
const BookingModel = require('./booking.model');
const SportModel = require('./sport.model');
const ReviewModel = require('./review.model');
const EventModel = require('./event.model');
const ProductModel = require('./product.model');
const PaymentModel = require('./payment.model');
const NotificationModel = require('./notification.model');

module.exports = {
    UserModel,
    VenueModel,
    BookingModel,
    SportModel,
    ReviewModel,
    EventModel,
    ProductModel,
    PaymentModel,
    NotificationModel,
};
