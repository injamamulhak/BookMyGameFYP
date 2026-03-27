const prisma = require('../config/prisma');

/**
 * User Model - Prisma Query Helpers
 * Encapsulates common user-related database operations
 */

// Standard select fields (excludes sensitive data like passwordHash)
const USER_PUBLIC_FIELDS = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    role: true,
    profileImage: true,
    isVerified: true,
    createdAt: true,
    updatedAt: true,
};

/**
 * Find user by email
 */
const findByEmail = async (email, includePassword = false) => {
    return prisma.user.findUnique({
        where: { email },
        ...(includePassword ? {} : { select: USER_PUBLIC_FIELDS }),
    });
};

/**
 * Find user by ID
 */
const findById = async (id, includePassword = false) => {
    return prisma.user.findUnique({
        where: { id },
        ...(includePassword ? {} : { select: USER_PUBLIC_FIELDS }),
    });
};

/**
 * Create a new user
 */
const createUser = async (data) => {
    return prisma.user.create({
        data,
        select: USER_PUBLIC_FIELDS,
    });
};

/**
 * Update user by ID
 */
const updateUser = async (id, data) => {
    return prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_FIELDS,
    });
};

/**
 * Find all users with optional filters (for admin)
 */
const findAll = async ({ role, search, page = 1, limit = 20 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        ...(role && { role }),
        ...(search && {
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: USER_PUBLIC_FIELDS,
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Delete user by ID
 */
const deleteUser = async (id) => {
    return prisma.user.delete({
        where: { id },
    });
};

module.exports = {
    USER_PUBLIC_FIELDS,
    findByEmail,
    findById,
    createUser,
    updateUser,
    findAll,
    deleteUser,
};
