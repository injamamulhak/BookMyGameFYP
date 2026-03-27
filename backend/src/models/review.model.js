const prisma = require('../config/prisma');

/**
 * Review Model - Prisma Query Helpers
 * Encapsulates common review-related database operations
 */

/**
 * Find reviews by venue ID with pagination
 */
const findByVenue = async (venueId, { page = 1, limit = 10 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { venueId },
            include: {
                user: {
                    select: { id: true, fullName: true, profileImage: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.review.count({ where: { venueId } }),
    ]);

    return { reviews, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find review by ID
 */
const findById = async (id) => {
    return prisma.review.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, fullName: true, profileImage: true },
            },
        },
    });
};

/**
 * Create a new review
 */
const createReview = async (data) => {
    return prisma.review.create({
        data,
        include: {
            user: {
                select: { id: true, fullName: true, profileImage: true },
            },
        },
    });
};

/**
 * Get venue rating statistics
 */
const getVenueStats = async (venueId) => {
    const stats = await prisma.review.aggregate({
        where: { venueId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    return {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
    };
};

/**
 * Check if user has already reviewed a venue
 */
const hasUserReviewed = async (userId, venueId) => {
    const review = await prisma.review.findFirst({
        where: { userId, venueId },
    });
    return !!review;
};

/**
 * Delete review by ID
 */
const deleteReview = async (id) => {
    return prisma.review.delete({
        where: { id },
    });
};

module.exports = {
    findByVenue,
    findById,
    createReview,
    getVenueStats,
    hasUserReviewed,
    deleteReview,
};
