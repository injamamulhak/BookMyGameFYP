const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth');

/**
 * Payment Routes
 * Handles Khalti payment gateway integration
 */

// Initiate Khalti payment for venue booking (requires authentication)
// POST /api/payments/khalti/initiate
router.post('/khalti/initiate', auth, paymentController.initiateKhaltiPayment);

// Initiate Khalti payment for event registration (requires authentication)
// POST /api/payments/khalti/initiate-event
router.post('/khalti/initiate-event', auth, paymentController.initiateEventPayment);

// Retry Khalti payment for an existing pending venue booking
// POST /api/payments/khalti/retry-booking
router.post('/khalti/retry-booking', auth, paymentController.retryBookingPayment);

// Retry Khalti payment for an existing pending event registration
// POST /api/payments/khalti/retry-event
router.post('/khalti/retry-event', auth, paymentController.retryEventPayment);

// Verify Khalti payment (callback - no auth needed as user returns from Khalti)
// GET /api/payments/khalti/verify
router.get('/khalti/verify', paymentController.verifyKhaltiPayment);

// Get payment status for a booking
// GET /api/payments/:bookingId/status
router.get('/:bookingId/status', auth, paymentController.getPaymentStatus);

module.exports = router;
