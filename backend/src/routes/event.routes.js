const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { auth, optionalAuth } = require('../middleware/auth');
const { isOperator } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createEventRules, updateEventRules } = require('../validators/event.validator');

/**
 * Event Routes
 * 
 * Public routes:
 * - GET /api/events - List all events with filters
 * - GET /api/events/featured - Get featured events
 * - GET /api/events/:id - Get single event details
 * 
 * User routes (authenticated):
 * - POST /api/events/:id/register - Register for event
 * - DELETE /api/events/:id/register - Cancel registration
 * - GET /api/events/my-registrations - Get user's registrations
 * 
 * Operator routes:
 * - GET /api/events/operator/my-events - Get operator's events
 * - POST /api/events - Create event
 * - PUT /api/events/:id - Update event
 * - DELETE /api/events/:id - Delete event
 * - GET /api/events/:id/registrations - Get event registrations
 */

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all events with filters
router.get('/', eventController.getAllEvents);

// Get featured events
router.get('/featured', eventController.getFeaturedEvents);

// ============================================
// USER ROUTES (Authenticated)
// ============================================

// Get user's event registrations
router.get('/my-registrations', auth, eventController.getMyRegistrations);

// ============================================
// OPERATOR ROUTES
// ============================================

// Get operator's events
router.get('/operator/my-events', auth, isOperator, eventController.getOperatorEvents);

// Create a new event
router.post('/', auth, isOperator, createEventRules, validate, eventController.createEvent);

// ============================================
// SINGLE EVENT ROUTES
// ============================================

// Get single event (with optional auth to check registration status)
router.get('/:id', optionalAuth, eventController.getEventById);

// Register for event
router.post('/:id/register', auth, eventController.registerForEvent);

// Cancel registration
router.delete('/:id/register', auth, eventController.cancelRegistration);

// Get event registrations (operator only)
router.get('/:id/registrations', auth, isOperator, eventController.getEventRegistrations);

// Update event
router.put('/:id', auth, isOperator, updateEventRules, validate, eventController.updateEvent);

// Delete event
router.delete('/:id', auth, isOperator, eventController.deleteEvent);

module.exports = router;
