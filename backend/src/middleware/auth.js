const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Find user by ID from token
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                profileImage: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // Attach user to request object
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
            });
        }

        res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};

module.exports = auth;
