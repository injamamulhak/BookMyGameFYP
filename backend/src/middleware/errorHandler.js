const config = require('../config');

/**
 * Global Error Handler Middleware
 * Centralized error handling for the entire application
 * 
 * Handles:
 * - Prisma-specific errors (unique constraint, not found, etc.)
 * - Validation errors
 * - JWT errors
 * - Multer file upload errors
 * - Generic errors with dev/prod differentiation
 * 
 * Usage: Must be the LAST middleware in server.js
 *   app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errors = null;

    // ── Prisma Errors ──
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                statusCode = 409;
                const field = err.meta?.target?.[0] || 'field';
                message = `A record with this ${field} already exists`;
                break;

            case 'P2025':
                // Record not found
                statusCode = 404;
                message = 'Record not found';
                break;

            case 'P2003':
                // Foreign key constraint failure
                statusCode = 400;
                message = 'Related record not found. Please check referenced data.';
                break;

            case 'P2014':
                // Required relation violation
                statusCode = 400;
                message = 'This operation would violate a required relation';
                break;

            default:
                // Other Prisma errors
                statusCode = 500;
                message = 'A database error occurred';
                break;
        }
    }

    // ── Multer File Upload Errors ──
    if (err.name === 'MulterError') {
        statusCode = 400;
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File too large. Maximum size is 50MB.';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Maximum is 10 files per upload.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field name';
                break;
            default:
                message = `File upload error: ${err.message}`;
        }
    }

    // ── JWT Errors ──
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // ── Validation Errors ──
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errors = err.errors;
    }

    // ── Build Response ──
    const response = {
        success: false,
        message,
        ...(errors && { errors }),
        ...(config.nodeEnv === 'development' && {
            stack: err.stack,
            code: err.code,
        }),
    };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
