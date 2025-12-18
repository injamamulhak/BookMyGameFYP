const config = require('./index');

/**
 * Email Configuration for NodeMailer
 * Using Gmail SMTP for sending verification emails
 */
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'BookMyGame <noreply@bookmygame.com>',
};

module.exports = emailConfig;
