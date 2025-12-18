import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

const authService = {
    /**
     * Register a new user
     */
    async signup(userData) {
        const response = await axios.post(`${API_URL}/auth/signup`, userData);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
        }
        return response.data;
    },

    /**
     * Login user
     */
    async login(credentials) {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
        }
        return response.data;
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }

        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        return response.data;
    },

    /**
     * Resend verification email
     */
    async resendVerification(email) {
        const response = await axios.post(`${API_URL}/auth/resend-verification`, { email });
        return response.data;
    },

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
    },

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        const response = await axios.post(`${API_URL}/auth/reset-password`, {
            token,
            newPassword
        });
        return response.data;
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
    },

    /**
     * Get stored token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },
};

export default authService;
