const prisma = require('../config/prisma');

/**
 * Product Model - Prisma Query Helpers
 * Encapsulates common product-related database operations
 */

/**
 * Find active products with filters and pagination
 */
const findActive = async ({ category, search, minPrice, maxPrice, page = 1, limit = 12 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        isActive: true,
        ...(category && { category: { equals: category, mode: 'insensitive' } }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
    };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                seller: {
                    select: { id: true, fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.product.count({ where }),
    ]);

    return { products, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find product by ID
 */
const findById = async (id) => {
    return prisma.product.findUnique({
        where: { id },
        include: {
            seller: {
                select: { id: true, fullName: true },
            },
        },
    });
};

/**
 * Create a new product
 */
const createProduct = async (data) => {
    return prisma.product.create({
        data,
    });
};

/**
 * Update product by ID
 */
const updateProduct = async (id, data) => {
    return prisma.product.update({
        where: { id },
        data,
    });
};

/**
 * Update product stock
 */
const updateStock = async (id, quantity) => {
    return prisma.product.update({
        where: { id },
        data: { stock: { increment: quantity } },
    });
};

/**
 * Delete product by ID (soft delete)
 */
const softDelete = async (id) => {
    return prisma.product.update({
        where: { id },
        data: { isActive: false },
    });
};

/**
 * Get all unique categories
 */
const getCategories = async () => {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
    });
    return products.map(p => p.category);
};

module.exports = {
    findActive,
    findById,
    createProduct,
    updateProduct,
    updateStock,
    softDelete,
    getCategories,
};
