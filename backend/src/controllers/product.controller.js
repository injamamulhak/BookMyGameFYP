const prisma = require('../config/prisma');

/**
 * Product Controller
 * Handles all product-related operations for the marketplace
 */

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// Get all active products (public)
// GET /api/products
const getAllProducts = async (req, res) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 12,
        } = req.query;

        const where = {
            isActive: true,
        };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const validSortFields = ['createdAt', 'price', 'name'];
        const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    seller: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { [orderField]: sortOrder === 'asc' ? 'asc' : 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.product.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
        });
    }
};

// Get product by ID (public)
// GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                seller: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
        });

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.json({
            success: true,
            data: { product },
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
        });
    }
};

// Get product categories (public)
// GET /api/products/categories
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.product.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });

        res.json({
            success: true,
            data: {
                categories: categories.map((c) => c.category),
            },
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
        });
    }
};

// ============================================
// ADMIN / OPERATOR ENDPOINTS
// ============================================

// Create product
// POST /api/products
const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, originalPrice, stock } = req.body;
        const user = req.user;

        // Operators must be approved to sell
        if (user.role === 'operator') {
            const fullUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { canSellProducts: true },
            });

            if (!fullUser.canSellProducts) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not approved to sell products. Please contact admin.',
                });
            }
        }

        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and price are required',
            });
        }

        // Handle image URL from file upload
        let imageUrl = null;
        if (req.file) {
            if (req.file.path && req.file.path.includes('cloudinary.com')) {
                imageUrl = req.file.path;
            } else if (req.file.filename) {
                imageUrl = `/uploads/products/${req.file.filename}`;
            }
        }

        const product = await prisma.product.create({
            data: {
                sellerId: user.role === 'admin' ? null : user.id,
                name,
                description: description || null,
                category,
                price: parseFloat(price),
                originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                stock: stock ? parseInt(stock) : 0,
                imageUrl,
                isActive: true,
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product },
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
        });
    }
};

// Update product
// PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, originalPrice, stock, isActive } = req.body;
        const user = req.user;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Only admin or the owner can update
        if (user.role !== 'admin' && existing.sellerId !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own products',
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (isActive !== undefined) updateData.isActive = isActive;

        // Handle image upload
        if (req.file) {
            if (req.file.path && req.file.path.includes('cloudinary.com')) {
                updateData.imageUrl = req.file.path;
            } else if (req.file.filename) {
                updateData.imageUrl = `/uploads/products/${req.file.filename}`;
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                seller: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product },
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
        });
    }
};

// Delete product
// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Only admin or the owner can delete
        if (user.role !== 'admin' && existing.sellerId !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own products',
            });
        }

        await prisma.product.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
        });
    }
};

// Get my products (operator)
// GET /api/products/seller/my-products
const getMyProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { sellerId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { products },
        });
    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your products',
        });
    }
};

// ============================================
// ADMIN ONLY ENDPOINTS
// ============================================

// Get all products (admin)
// GET /api/products/admin/all
const getAllProductsAdmin = async (req, res) => {
    try {
        const { category, search, isActive, page = 1, limit = 20 } = req.query;

        const where = {};

        if (category) where.category = category;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    seller: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.product.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Admin get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    getMyProducts,
    getAllProductsAdmin,
};
