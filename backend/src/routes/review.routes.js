const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewRules } = require('../validators/review.validator');

/**
 * Review Routes
 * Public and authenticated endpoints for review management
 */

// Public Routes
// GET /api/reviews/venue/:venueId - Get all reviews for a venue
router.get('/venue/:venueId', reviewController.getVenueReviews);

// Authenticated Routes
// GET /api/reviews/can-review/:venueId - Check if user can review
router.get('/can-review/:venueId', auth, reviewController.canReviewVenue);

// POST /api/reviews - Create a new review
router.post('/', auth, createReviewRules, validate, reviewController.createReview);

// PUT /api/reviews/:id - Update own review
router.put('/:id', auth, reviewController.updateReview);

// PATCH /api/reviews/:id/flag - Flag or unflag a review
router.patch('/:id/flag', auth, reviewController.toggleFlagReview);

// --- REPLIES ---
const reviewReplyController = require('../controllers/reviewReply.controller');

// POST /api/reviews/:reviewId/replies - Add a reply
router.post('/:reviewId/replies', auth, reviewReplyController.createReply);

// DELETE /api/reviews/replies/:id - Delete a reply
router.delete('/replies/:id', auth, reviewReplyController.deleteReply);

module.exports = router;
