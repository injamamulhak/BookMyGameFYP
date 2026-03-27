const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { auth } = require('../middleware/auth');
const { isOperator, isUser } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createBookingRules } = require('../validators/booking.validator');

/**
 * Booking Routes
 * User and operator endpoints for booking management
 */

// ============================================
// USER ROUTES (Protected)
// ============================================

// GET /api/bookings/my-bookings - Get user's own bookings
router.get('/my-bookings', auth, isUser, bookingController.getUserBookings);

// GET /api/bookings/my-bookings/:id - Get user's own booking by ID
router.get('/my-bookings/:id', auth, isUser, bookingController.getUserBookingById);

// POST /api/bookings - Create new booking
router.post('/', auth, isUser, createBookingRules, validate, bookingController.createBooking);

// PUT /api/bookings/:id/cancel - Cancel user's own booking
router.put('/:id/cancel', auth, isUser, bookingController.cancelUserBooking);

// ============================================
// OPERATOR ROUTES (Protected)
// ============================================

// GET /api/bookings/operator - Get all bookings for operator's venues
router.get('/operator', auth, isOperator, bookingController.getOperatorBookings);

// GET /api/bookings/operator/calendar/:venueId - Get booking calendar for a venue
router.get('/operator/calendar/:venueId', auth, isOperator, bookingController.getBookingCalendar);

// GET /api/bookings/operator/:id - Get booking details by ID
router.get('/operator/:id', auth, isOperator, bookingController.getOperatorBookingById);

// PUT /api/bookings/operator/:id/confirm - Confirm booking
router.put('/operator/:id/confirm', auth, isOperator, bookingController.confirmBooking);

// PUT /api/bookings/operator/:id/cancel - Cancel booking (operator)
router.put('/operator/:id/cancel', auth, isOperator, bookingController.cancelBooking);

// POST /api/bookings/operator/walk-in - Create a walk-in booking (operator)
router.post('/operator/walk-in', auth, isOperator, bookingController.createOperatorBooking);

module.exports = router;
