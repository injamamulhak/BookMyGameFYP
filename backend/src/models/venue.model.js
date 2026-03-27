const prisma = require('../config/prisma');

/**
 * Venue Model - Prisma Query Helpers
 * Encapsulates common venue-related database operations
 */

// Standard include for venue listings (lightweight)
const VENUE_LIST_INCLUDE = {
    sport: true,
    images: {
        where: { isPrimary: true },
        take: 1,
    },
    operator: {
        select: { id: true, fullName: true },
    },
    _count: {
        select: { reviews: true },
    },
};

// Detailed include for single venue view
const VENUE_DETAIL_INCLUDE = {
    sport: true,
    images: {
        orderBy: { displayOrder: 'asc' },
    },
    operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
    },
    operator: {
        select: { id: true, fullName: true, phone: true },
    },
    reviews: {
        include: {
            user: {
                select: { id: true, fullName: true, profileImage: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    },
    _count: {
        select: { reviews: true },
    },
};

/**
 * Find all approved venues with filters (public)
 */
const findApproved = async ({ city, sport, search, minPrice, maxPrice, page = 1, limit = 10 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        isActive: true,
        approvalStatus: 'approved',
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(minPrice && { pricePerHour: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { pricePerHour: { lte: parseFloat(maxPrice) } }),
        ...(sport && {
            sport: {
                name: { equals: sport, mode: 'insensitive' },
            },
        }),
    };

    const [venues, total] = await Promise.all([
        prisma.venue.findMany({
            where,
            include: VENUE_LIST_INCLUDE,
            orderBy: { rating: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.venue.count({ where }),
    ]);

    return { venues, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find venue by ID with full details
 */
const findByIdWithDetails = async (id) => {
    return prisma.venue.findUnique({
        where: { id },
        include: VENUE_DETAIL_INCLUDE,
    });
};

/**
 * Find venues by operator ID
 */
const findByOperator = async (operatorId, { status, approvalStatus } = {}) => {
    const where = {
        operatorId,
        ...(status === 'active' && { isActive: true }),
        ...(status === 'inactive' && { isActive: false }),
        ...(approvalStatus && { approvalStatus }),
    };

    return prisma.venue.findMany({
        where,
        include: {
            sport: true,
            images: {
                where: { isPrimary: true },
                take: 1,
            },
            _count: {
                select: { reviews: true, timeSlots: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Find operator's venue by ID (with ownership check)
 */
const findOperatorVenue = async (id, operatorId) => {
    return prisma.venue.findFirst({
        where: { id, operatorId },
    });
};

/**
 * Create a new venue
 */
const createVenue = async (data) => {
    return prisma.venue.create({
        data,
        include: {
            sport: true,
            images: true,
            operatingHours: true,
        },
    });
};

/**
 * Update venue by ID
 */
const updateVenue = async (id, data) => {
    return prisma.venue.update({
        where: { id },
        data,
        include: {
            sport: true,
            images: true,
            operatingHours: true,
        },
    });
};

/**
 * Soft delete venue (deactivate)
 */
const softDelete = async (id) => {
    return prisma.venue.update({
        where: { id },
        data: { isActive: false },
    });
};

module.exports = {
    VENUE_LIST_INCLUDE,
    VENUE_DETAIL_INCLUDE,
    findApproved,
    findByIdWithDetails,
    findByOperator,
    findOperatorVenue,
    createVenue,
    updateVenue,
    softDelete,
};
