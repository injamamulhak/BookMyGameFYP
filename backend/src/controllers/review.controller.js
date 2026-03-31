const prisma = require('../config/prisma');
const { createNotification } = require('../models/notification.model');

/**
 * Review Controller
 * Handles all review-related operations for venues
 */

// Get all reviews for a venue (public)
// GET /api/reviews/venue/:venueId
const getVenueReviews = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Determine sort order
        const orderBy = sort === 'oldest'
            ? { createdAt: 'asc' }
            : sort === 'highest'
                ? { rating: 'desc' }
                : sort === 'lowest'
                    ? { rating: 'asc' }
                    : { createdAt: 'desc' }; // newest (default)

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { venueId },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                        },
                    },
                    replies: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    role: true,
                                    profileImage: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy,
                skip,
                take,
            }),
            prisma.review.count({ where: { venueId } }),
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        console.error('Get venue reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
        });
    }
};

// Create a new review (authenticated)
// POST /api/reviews
const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { venueId, rating, comment, bookingId } = req.dto;

        // Check if venue exists
        const venue = await prisma.venue.findUnique({
            where: { id: venueId },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

        // Check if user has a completed booking for this venue (optional but recommended)
        if (bookingId) {
            const booking = await prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    userId,
                    slot: { venueId },
                    status: { in: ['confirmed', 'completed'] },
                },
            });

            if (!booking) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid booking or booking not eligible for review',
                });
            }

            // Check if booking already has a review
            const existingReview = await prisma.review.findUnique({
                where: { bookingId },
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this booking',
                });
            }
        }

        // Check if user already reviewed this venue (if no booking provided)
        if (!bookingId) {
            const existingReview = await prisma.review.findFirst({
                where: {
                    userId,
                    venueId,
                    bookingId: null,
                },
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this venue',
                });
            }
        }

        // Create the review
        const review = await prisma.review.create({
            data: {
                userId,
                venueId,
                bookingId: bookingId || null,
                rating: parseInt(rating),
                comment: comment?.trim() || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
        });

        // Update venue's average rating and total reviews
        const stats = await prisma.review.aggregate({
            where: { venueId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await prisma.venue.update({
            where: { id: venueId },
            data: {
                rating: stats._avg.rating || 0,
                totalReviews: stats._count.rating || 0,
            },
        });

        // Notify operator about the new review
        if (venue.operatorId && venue.operatorId !== userId) {
            await createNotification({
                userId: venue.operatorId,
                type: 'new_review',
                title: 'New Venue Review',
                message: `Your venue ${venue.name} received a new ${rating}-star review.`,
                relatedEntityType: 'review',
                relatedEntityId: review.id,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review,
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
        });
    }
};

// Update own review (authenticated)
// PUT /api/reviews/:id
const updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, comment } = req.body;

        // Find the review
        const review = await prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        // Check ownership
        if (review.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews',
            });
        }

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
            });
        }

        // Update the review
        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                rating: rating ? parseInt(rating) : undefined,
                comment: comment !== undefined ? comment?.trim() || null : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
        });

        // Update venue's average rating
        const stats = await prisma.review.aggregate({
            where: { venueId: review.venueId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const venueInfo = await prisma.venue.update({
            where: { id: review.venueId },
            data: {
                rating: stats._avg.rating || 0,
                totalReviews: stats._count.rating || 0,
            },
        });

        // Notify operator about updated review
        if (venueInfo.operatorId && venueInfo.operatorId !== userId) {
            await createNotification({
                userId: venueInfo.operatorId,
                type: 'updated_review',
                title: 'Review Updated',
                message: `A user has updated their ${rating}-star review on your venue ${venueInfo.name}.`,
                relatedEntityType: 'review',
                relatedEntityId: updatedReview.id,
            });
        }

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: updatedReview,
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
        });
    }
};

// Delete own review (authenticated)
// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Find the review
        const review = await prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        // Check ownership (admins can also delete)
        if (review.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews',
            });
        }

        const venueId = review.venueId;

        // Delete the review
        await prisma.review.delete({
            where: { id },
        });

        // Update venue's average rating
        const stats = await prisma.review.aggregate({
            where: { venueId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await prisma.venue.update({
            where: { id: venueId },
            data: {
                rating: stats._avg.rating || 0,
                totalReviews: stats._count.rating || 0,
            },
        });

        res.json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
        });
    }
};

// Check if user can review a venue (authenticated)
// GET /api/reviews/can-review/:venueId
const canReviewVenue = async (req, res) => {
    try {
        const userId = req.user.id;
        const { venueId } = req.params;

        // Check if user has any completed booking for this venue
        const completedBooking = await prisma.booking.findFirst({
            where: {
                userId,
                slot: { venueId },
                status: { in: ['confirmed', 'completed'] },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Check if user already has a review for this venue
        const existingReview = await prisma.review.findFirst({
            where: {
                userId,
                venueId,
            },
        });

        // Check if the booking already has a review
        let bookingHasReview = false;
        if (completedBooking) {
            const bookingReview = await prisma.review.findFirst({
                where: { bookingId: completedBooking.id },
            });
            bookingHasReview = !!bookingReview;
        }

        res.json({
            success: true,
            data: {
                canReview: !!completedBooking && !existingReview,
                hasBooking: !!completedBooking,
                hasReviewed: !!existingReview,
                eligibleBookingId: completedBooking && !bookingHasReview
                    ? completedBooking.id
                    : null,
            },
        });
    } catch (error) {
        console.error('Can review check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check review eligibility',
        });
    }
};

// Toggle flag status of a review (authenticated, Operator/Admin only)
// PATCH /api/reviews/:id/flag
const toggleFlagReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const review = await prisma.review.findUnique({
            where: { id },
            include: { venue: true }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        // Only venue operator or admin can flag
        if (review.venue.operatorId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to flag this review',
            });
        }

        const updatedReview = await prisma.review.update({
            where: { id },
            data: { isFlagged: !review.isFlagged },
        });

        res.json({
            success: true,
            message: `Review ${updatedReview.isFlagged ? 'flagged' : 'unflagged'} successfully`,
            data: updatedReview,
        });
    } catch (error) {
        console.error('Toggle flag review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle review flag',
        });
    }
};

module.exports = {
    getVenueReviews,
    createReview,
    updateReview,
    deleteReview,
    canReviewVenue,
    toggleFlagReview,
};
