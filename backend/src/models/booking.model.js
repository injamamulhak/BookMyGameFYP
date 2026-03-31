const prisma = require('../config/prisma');

/**
 * Booking Model - Prisma Query Helpers
 * Encapsulates common booking-related database operations
 */

/**
 * Find bookings by user ID with pagination
 */
const findByUser = async (userId, { status, page = 1, limit = 10 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        userId,
        ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                slot: {
                    include: {
                        venue: {
                            include: {
                                images: { where: { isPrimary: true }, take: 1 },
                            },
                        },
                    },
                },
                payments: {
                    select: { status: true, amount: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.booking.count({ where }),
    ]);

    return { bookings, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find bookings for operator's venues with pagination
 */
const findByOperatorVenues = async (venueIds, { venueId, status, startDate, endDate, page = 1, limit = 20 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate)   dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    const where = {
        slot: {
            venueId: venueId ? venueId : { in: venueIds },
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                slot: {
                    include: {
                        venue: { select: { id: true, name: true } },
                    },
                },
                payments: {
                    select: { id: true, amount: true, status: true, paymentMethod: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.booking.count({ where }),
    ]);

    return { bookings, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find booking by ID with full details
 */
const findById = async (id) => {
    return prisma.booking.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, fullName: true, email: true, phone: true, profileImage: true },
            },
            slot: {
                include: {
                    venue: {
                        select: { id: true, name: true, address: true, operatorId: true },
                    },
                },
            },
            payments: true,
            review: true,
        },
    });
};

/**
 * Create a new booking
 */
const createBooking = async (data) => {
    return prisma.booking.create({
        data,
        include: {
            slot: {
                include: { venue: { select: { id: true, name: true } } },
            },
        },
    });
};

/**
 * Update booking status
 */
const updateStatus = async (id, status, additionalData = {}) => {
    return prisma.booking.update({
        where: { id },
        data: { status, ...additionalData },
        include: {
            user: { select: { id: true, fullName: true, email: true } },
            slot: { include: { venue: { select: { name: true } } } },
        },
    });
};

/**
 * Get calendar time slots for a venue within a date range
 */
const getCalendarSlots = async (venueId, startDate, endDate) => {
    return prisma.timeSlot.findMany({
        where: {
            venueId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            bookings: {
                include: {
                    user: { select: { id: true, fullName: true } },
                },
            },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
};

/**
 * Count active bookings for a venue
 */
const countActiveByVenue = async (venueId) => {
    return prisma.booking.count({
        where: {
            slot: { venueId },
            status: { in: ['pending', 'confirmed'] },
        },
    });
};

module.exports = {
    findByUser,
    findByOperatorVenues,
    findById,
    createBooking,
    updateStatus,
    getCalendarSlots,
    countActiveByVenue,
};
