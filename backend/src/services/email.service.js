const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const { getVerificationEmailTemplate, getPasswordResetTemplate } = require('../utils/email.templates');

/**
 * Email Service
 * Handles sending emails using NodeMailer
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Initialize NodeMailer transporter
     */
    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                auth: emailConfig.auth,
            });

            // Verify connection configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Email service error:', error.message);
                    console.log('⚠️  Email sending will not work. Please check your email configuration.');
                } else {
                    console.log('✅ Email service is ready to send emails');
                }
            });
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, userName, verificationToken) {
        try {
            // Construct verification link
            const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

            // Get HTML template
            const htmlContent = getVerificationEmailTemplate(userName, verificationLink);

            // Email options
            const mailOptions = {
                from: emailConfig.from,
                to: email,
                subject: 'Verify Your Email - BookMyGame',
                html: htmlContent,
                text: `Hi ${userName},\n\nWelcome to BookMyGame! Please verify your email by clicking this link: ${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
            };

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Verification email sent:', info.messageId);
            console.log('📧 Sent to:', email);

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('❌ Error sending verification email:', error);

            // Don't throw error - allow user registration to continue even if email fails
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, userName, resetToken) {
        try {
            // Construct reset link
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

            // Get HTML template
            const htmlContent = getPasswordResetTemplate(userName, resetLink);

            // Email options
            const mailOptions = {
                from: emailConfig.from,
                to: email,
                subject: 'Reset Your Password - BookMyGame',
                html: htmlContent,
                text: `Hi ${userName},\n\nWe received a request to reset your password. Please reset your password by clicking this link: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
            };

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Password reset email sent:', info.messageId);
            console.log('📧 Sent to:', email);

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Test email connection
     */
    async testConnection() {
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email service is working' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
