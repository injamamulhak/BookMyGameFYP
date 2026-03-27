const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sport.controller');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

/**
 * Sport Routes
 */

// GET /api/sports - Get all sports (public)
router.get('/', sportController.getSports);

// GET /api/sports/with-venue-counts - Get all sports with venue counts (public)
router.get('/with-venue-counts', sportController.getSportsWithVenueCounts);

// POST /api/sports - Create sport (admin only)
router.post('/', auth, isAdmin, sportController.createSport);

module.exports = router;
