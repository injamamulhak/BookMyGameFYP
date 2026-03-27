const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

/**
 * Training Video Routes
 *
 * Public routes:
 * - GET /api/training         - List all active videos (with filters)
 * - GET /api/training/featured - Get top-viewed videos (for landing page)
 * - GET /api/training/:id     - Get single video (increments view count)
 *
 * Admin routes:
 * - GET    /api/training/admin/all - All videos including inactive
 * - POST   /api/training/admin     - Create a new video
 * - PUT    /api/training/admin/:id - Update a video
 * - DELETE /api/training/admin/:id - Delete a video
 */

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all active training videos (filterable)
router.get('/', trainingController.getAllVideos);

// Get featured / top-viewed videos
router.get('/featured', trainingController.getFeaturedVideos);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all videos (incl. inactive) — admin
router.get('/admin/all', auth, isAdmin, trainingController.adminGetAllVideos);

// Create a new training video — admin
router.post('/admin', auth, isAdmin, trainingController.createVideo);

// Update a training video — admin
router.put('/admin/:id', auth, isAdmin, trainingController.updateVideo);

// Delete a training video — admin
router.delete('/admin/:id', auth, isAdmin, trainingController.deleteVideo);

// ============================================
// SINGLE VIDEO ROUTE (must come after named routes)
// ============================================

// Get single training video by ID (increments view count)
router.get('/:id', trainingController.getVideoById);

module.exports = router;
