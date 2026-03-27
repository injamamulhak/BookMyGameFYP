const prisma = require('../config/prisma');

/**
 * Payment Model - Prisma Query Helpers
 * Encapsulates common payment-related database operations
 */

/**
 * Create a new payment record
 */
const createPayment = async (data) => {
    return prisma.payment.create({
        data,
    });
};

/**
 * Find payment by ID
 */
const findById = async (id) => {
    return prisma.payment.findUnique({
        where: { id },
        include: {
            booking: {
                include: {
                    slot: {
                        include: {
                            venue: { select: { id: true, name: true } },
                        },
                    },
                },
            },
            order: true,
            user: {
                select: { id: true, fullName: true, email: true },
            },
        },
    });
};

/**
 * Find payment by transaction ID
 */
const findByTransactionId = async (transactionId) => {
    return prisma.payment.findUnique({
        where: { transactionId },
    });
};

/**
 * Find payments by booking ID
 */
const findByBooking = async (bookingId) => {
    return prisma.payment.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Find payments by user ID
 */
const findByUser = async (userId, { page = 1, limit = 20 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where: { userId },
            include: {
                booking: {
                    include: {
                        slot: {
                            include: {
                                venue: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                order: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.payment.count({ where: { userId } }),
    ]);

    return { payments, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Update payment status
 */
const updateStatus = async (id, status, gatewayResponse = null) => {
    return prisma.payment.update({
        where: { id },
        data: {
            status,
            ...(gatewayResponse && { gatewayResponse }),
        },
    });
};

module.exports = {
    createPayment,
    findById,
    findByTransactionId,
    findByBooking,
    findByUser,
    updateStatus,
};
