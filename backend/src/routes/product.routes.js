const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { auth } = require('../middleware/auth');
const { isOperator, isAdmin } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

/**
 * Product Routes
 * Public routes for browsing, authenticated routes for management
 */

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/products/categories - Get all categories (must be before /:id)
router.get('/categories', productController.getCategories);

// GET /api/products - List all active products
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Get product detail
router.get('/:id', productController.getProductById);

// ============================================
// OPERATOR ROUTES (must be before generic :id routes)
// ============================================

// GET /api/products/seller/my-products - Get operator's own products
router.get('/seller/my-products', auth, isOperator, productController.getMyProducts);

// GET /api/products/seller/status - Check seller request status
router.get('/seller/status', auth, isOperator, async (req, res) => {
    try {
        const prisma = require('../config/prisma');
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { canSellProducts: true, sellerRequestStatus: true },
        });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
});

// POST /api/products/seller/request - Request to become a seller
router.post('/seller/request', auth, isOperator, async (req, res) => {
    try {
        const prisma = require('../config/prisma');
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { canSellProducts: true, sellerRequestStatus: true },
        });

        if (user.canSellProducts) {
            return res.status(400).json({ success: false, message: 'You are already approved as a seller' });
        }
        if (user.sellerRequestStatus === 'pending') {
            return res.status(400).json({ success: false, message: 'Your request is already pending' });
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { sellerRequestStatus: 'pending' },
        });

        res.json({ success: true, message: 'Seller request submitted! Admin will review your request.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET /api/products/admin/all - Get all products (admin)
router.get('/admin/all', auth, isAdmin, productController.getAllProductsAdmin);

// ============================================
// AUTHENTICATED ROUTES (Admin + Operator)
// ============================================

// POST /api/products - Create product
router.post('/', auth, isOperator, upload.single('image'), productController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', auth, isOperator, upload.single('image'), productController.updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', auth, isOperator, productController.deleteProduct);

module.exports = router;
