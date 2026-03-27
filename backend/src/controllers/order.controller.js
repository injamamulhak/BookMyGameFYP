const prisma = require('../config/prisma');

/**
 * Order Controller
 * Handles all marketplace order operations
 */

// ============================================
// USER ENDPOINTS
// ============================================

// Create a new order
// POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        const userId = req.user.id;

        // Verify all products exist and calculate total amount
        const productIds = items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true
            }
        });

        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more products are invalid or unavailable.'
            });
        }

        // Map products for easy access
        const productMap = {};
        products.forEach(p => { productMap[p.id] = p; });

        let totalAmount = 0;
        const orderItemsData = [];

        // Check stock and build order items
        for (const item of items) {
            const product = productMap[item.productId];
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}`
                });
            }

            const itemPrice = parseFloat(product.price);
            totalAmount += itemPrice * item.quantity;

            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: itemPrice
            });
        }

        // Use interactive transaction to create order and reduce stock atomically
        const order = await prisma.$transaction(async (tx) => {
            // 1. Create Order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    shippingAddress,
                    status: 'pending',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, imageUrl: true }
                            }
                        }
                    }
                }
            });

            // 2. Reduce Stock for each product
            for (const item of orderItemsData) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return newOrder;
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};

// Get user's order history
// GET /api/orders/my-orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            data: { orders }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders'
        });
    }
};

// Get specific order details
// GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                sellerId: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Authorization check: User can only view their own order, Admin can view any
        if (order.userId !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order'
        });
    }
};


// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all orders (Admin only)
// GET /api/orders/admin/all
const getAllOrdersAdmin = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get all orders admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve all orders'
        });
    }
};

// Update order status (Admin only)
// PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If order is cancelled, optionally restore stock
        if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
            await prisma.$transaction(async (tx) => {
                // Update status
                const updatedOrder = await tx.order.update({
                    where: { id },
                    data: { status }
                });

                // Restore stock
                for (const item of existingOrder.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity }
                        }
                    });
                }
                return updatedOrder;
            });
            
            return res.json({
                success: true,
                message: 'Order cancelled and stock restored successfully'
            });
        }

        // Normal status update
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrdersAdmin,
    updateOrderStatus
};
