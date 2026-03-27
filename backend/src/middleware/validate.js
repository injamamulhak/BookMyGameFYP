const { validationResult, matchedData } = require('express-validator');

/**
 * Validation Middleware
 * Runs express-validator validation result check
 * Returns formatted 400 error if validation fails
 * Attaches sanitized DTO (only validated fields) to req.dto
 * 
 * Usage in routes:
 *   const { signupRules } = require('../validators/auth.validator');
 *   const validate = require('../middleware/validate');
 * 
 *   router.post('/signup', signupRules, validate, authController.signup);
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Format errors into a user-friendly structure
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
        });
    }

    // Attach sanitized DTO — only validated/sanitized fields from the request body
    req.dto = matchedData(req, { locations: ['body'] });

    next();
};

module.exports = validate;

