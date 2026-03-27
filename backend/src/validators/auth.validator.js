const { body } = require('express-validator');

/**
 * Auth Validators
 * Validation rules for authentication endpoints using express-validator
 */

const signupRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^(?:\+?977[- ]?)?[9][7-8]\d{8}$/).withMessage('Must be a valid 10-digit Nepali phone number'),
    body('role')
        .optional()
        .isIn(['user', 'operator']).withMessage('Role must be either "user" or "operator"'),
];

const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
];

const updatePasswordRules = [
    body('oldPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

const updateProfileRules = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^(?:\+?977[- ]?)?[9][7-8]\d{8}$/).withMessage('Must be a valid 10-digit Nepali phone number'),
];

const forgotPasswordRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
];

const resetPasswordRules = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const resendVerificationRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
];

module.exports = {
    signupRules,
    loginRules,
    updatePasswordRules,
    updateProfileRules,
    forgotPasswordRules,
    resetPasswordRules,
    resendVerificationRules,
};
