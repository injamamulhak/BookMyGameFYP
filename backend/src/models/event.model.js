const prisma = require('../config/prisma');

/**
 * Event Model - Prisma Query Helpers
 * Encapsulates common event-related database operations
 */

/**
 * Find upcoming events with pagination
 */
const findUpcoming = async ({ page = 1, limit = 10 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        endDate: { gte: new Date() },
    };

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            include: {
                venue: {
                    select: { id: true, name: true, address: true, city: true },
                },
                _count: {
                    select: { registrations: true },
                },
            },
            orderBy: { startDate: 'asc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.event.count({ where }),
    ]);

    return { events, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find events by venue ID
 */
const findByVenue = async (venueId) => {
    return prisma.event.findMany({
        where: { venueId },
        include: {
            _count: {
                select: { registrations: true },
            },
        },
        orderBy: { startDate: 'asc' },
    });
};

/**
 * Find event by ID with full details
 */
const findById = async (id) => {
    return prisma.event.findUnique({
        where: { id },
        include: {
            venue: {
                select: { id: true, name: true, address: true, city: true, operatorId: true },
            },
            registrations: {
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            },
            _count: {
                select: { registrations: true },
            },
        },
    });
};

/**
 * Create a new event
 */
const createEvent = async (data) => {
    return prisma.event.create({
        data,
        include: {
            venue: {
                select: { id: true, name: true },
            },
        },
    });
};

/**
 * Update event by ID
 */
const updateEvent = async (id, data) => {
    return prisma.event.update({
        where: { id },
        data,
    });
};

/**
 * Register user for an event
 */
const registerUser = async (eventId, userId) => {
    return prisma.eventRegistration.create({
        data: {
            eventId,
            userId,
            paymentStatus: 'pending',
        },
    });
};

/**
 * Check if user is already registered for an event
 */
const isUserRegistered = async (eventId, userId) => {
    const registration = await prisma.eventRegistration.findUnique({
        where: {
            eventId_userId: { eventId, userId },
        },
    });
    return !!registration;
};

/**
 * Delete event by ID
 */
const deleteEvent = async (id) => {
    return prisma.event.delete({
        where: { id },
    });
};

module.exports = {
    findUpcoming,
    findByVenue,
    findById,
    createEvent,
    updateEvent,
    registerUser,
    isUserRegistered,
    deleteEvent,
};
