const express = require('express');
const router = express.Router();
const timeslotController = require('../controllers/timeslot.controller');
const { auth } = require('../middleware/auth');
const { isOperator } = require('../middleware/roleCheck');

/**
 * TimeSlot Routes
 * Public and operator endpoints for time slot management
 */

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/timeslots/venue/:venueId - Get available time slots for a venue
router.get('/venue/:venueId', timeslotController.getVenueTimeSlots);

// ============================================
// OPERATOR ROUTES (Protected)
// ============================================

// POST /api/timeslots/operator/venue/:venueId - Create time slots (now used for single slot price overrides)
router.post('/operator/venue/:venueId', auth, isOperator, timeslotController.createTimeSlots);

// PUT /api/timeslots/operator/:id - Update time slot
router.put('/operator/:id', auth, isOperator, timeslotController.updateTimeSlot);

// DELETE /api/timeslots/operator/:id - Delete time slot
router.delete('/operator/:id', auth, isOperator, timeslotController.deleteTimeSlot);

// ============================================
// USER ROUTES (Authenticated)
// ============================================

// POST /api/timeslots/:id/lock - Lock a slot for 90s
router.post('/:id/lock', auth, timeslotController.lockSlot);

// POST /api/timeslots/:id/unlock - Release a slot lock
router.post('/:id/unlock', auth, timeslotController.unlockSlot);

module.exports = router;
