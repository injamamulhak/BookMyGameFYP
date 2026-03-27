const prisma = require('../config/prisma');

/**
 * Sport Model - Prisma Query Helpers
 * Encapsulates common sport-related database operations
 */

/**
 * Find all active sports
 */
const findAll = async (includeInactive = false) => {
    return prisma.sport.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
    });
};

/**
 * Find sport by ID
 */
const findById = async (id) => {
    return prisma.sport.findUnique({
        where: { id },
    });
};

/**
 * Find sport by name
 */
const findByName = async (name) => {
    return prisma.sport.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
    });
};

/**
 * Create a new sport
 */
const create = async (data) => {
    return prisma.sport.create({
        data,
    });
};

/**
 * Update sport by ID
 */
const update = async (id, data) => {
    return prisma.sport.update({
        where: { id },
        data,
    });
};

/**
 * Delete sport by ID
 */
const remove = async (id) => {
    return prisma.sport.delete({
        where: { id },
    });
};

module.exports = {
    findAll,
    findById,
    findByName,
    create,
    update,
    remove,
};
