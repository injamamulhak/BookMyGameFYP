const authService = require('../services/auth.service');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * POST /api/auth/signup
 * Register a new user
 */
const signup = async (req, res) => {
    try {
        const { email, password, fullName, phone, role } = req.dto;

        // Register user
        const { user } = await authService.register({
            email,
            password,
            fullName,
            phone,
            role,
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            data: {
                user,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);

        if (error.message === 'User with this email already exists') {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/login
 * Login user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.dto;

        // Attempt login
        const { user, token } = await authService.login(email, password);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);

        if (error.message === 'Invalid email or password') {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: error.message,
        });
    }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getCurrentUser = async (req, res) => {
    try {
        // User is already attached to req by auth middleware
        res.json({
            success: true,
            data: req.user,
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information',
        });
    }
};

/**
 * PUT /api/auth/password
 * Update user password
 */
const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.dto;

        await authService.updatePassword(req.user.id, oldPassword, newPassword);

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Update password error:', error);

        if (error.message === 'Current password is incorrect') {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update password',
        });
    }
};

/**
 * PUT /api/auth/profile
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName, phone } = req.dto;
        const { profileImage } = req.body; // profileImage is not in validator rules
        const userId = req.user.id;

        const updatedUser = await authService.updateProfile(userId, {
            fullName,
            phone: phone || null,
            profileImage: profileImage || null,
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
};

/**
 * POST /api/auth/profile/image
 * Upload profile image to Cloudinary (returns URL, does NOT save to profile)
 * The URL should be sent back via PUT /api/auth/profile to save
 */
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided',
            });
        }

        // Get image URL from uploaded file
        const { getImageUrl } = require('../middleware/upload');
        const imageUrl = getImageUrl(req.file);

        if (!imageUrl) {
            return res.status(500).json({
                success: false,
                message: 'Failed to process uploaded image',
            });
        }

        // Just return the URL - don't save to database yet
        // The frontend will include this URL when saving the full profile
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                profileImage: imageUrl,
            },
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Check for timeout errors from Cloudinary
        if (error.name === 'TimeoutError' || error.message?.includes('Timeout') || error.http_code === 499) {
            return res.status(408).json({
                success: false,
                message: 'Image upload timed out. Please try a smaller image or check your internet connection.',
            });
        }

        // Check for Cloudinary specific errors
        if (error.http_code) {
            return res.status(error.http_code === 400 ? 400 : 500).json({
                success: false,
                message: `Cloudinary error: ${error.message || 'Upload failed'}`,
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload profile image. Please try again.',
        });
    }
};

/**
 * GET /api/auth/verify-email/:token
 * Verify user email with token
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required',
            });
        }

        const user = await authService.verifyEmail(token);

        res.json({
            success: true,
            message: 'Email verified successfully! You can now access all features.',
            data: { user },
        });
    } catch (error) {
        console.error('Verify email error:', error);

        if (error.message === 'Invalid or expired verification token') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to verify email',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
const resendVerification = async (req, res) => {
    try {
        const { email } = req.dto;

        const result = await authService.resendVerification(email);

        res.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.',
            data: result,
        });
    } catch (error) {
        console.error('Resend verification error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email',
            });
        }

        if (error.message === 'Email already verified') {
            return res.status(400).json({
                success: false,
                message: 'This email is already verified',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.dto;

        const result = await authService.forgotPassword(email);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Forgot password error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.dto;

        const result = await authService.resetPassword(token, newPassword);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Reset password error:', error);

        if (error.message === 'Invalid or expired reset token') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message,
        });
    }
};

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
    try {
        // In JWT, logout is typically handled client-side by removing the token
        // This endpoint can be used for logging purposes or token blacklisting in future
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
        });
    }
};

module.exports = {
    signup,
    login,
    getCurrentUser,
    updatePassword,
    updateProfile,
    uploadProfileImage,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
};
