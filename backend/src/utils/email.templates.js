/**
 * Email Templates for BookMyGame
 * Professional HTML email templates
 */

const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BookMyGame</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #667eea;
            margin-top: 0;
            font-size: 24px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            margin: 20px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
        }
        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 30px 0;
        }
        .highlight {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🏀 BookMyGame</h1>
        </div>
        ${content}
        <div class="footer">
            <p><strong>BookMyGame</strong></p>
            <p>Your premier sports venue booking platform</p>
            <p style="margin-top: 15px;">
                <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Help Center</a> |
                <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Contact Us</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                © ${new Date().getFullYear()} BookMyGame. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Email Verification Template
 */
const getVerificationEmailTemplate = (userName, verificationLink, expiryHours = 24) => {
    const content = `
        <div class="content">
            <h2>Welcome to BookMyGame! 👋</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for signing up! We're excited to have you join our community of sports enthusiasts.</p>
            <p>To complete your registration and start booking amazing sports venues, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <div class="highlight">
                <p style="margin: 0;"><strong>⏰ Important:</strong> This verification link will expire in <strong>${expiryHours} hours</strong>.</p>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px;">
                ${verificationLink}
            </p>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #6c757d;">
                If you didn't create an account with BookMyGame, you can safely ignore this email.
            </p>
        </div>
    `;

    return getBaseTemplate(content);
};

/**
 * Verification Success Template
 */
const getVerificationSuccessTemplate = (userName) => {
    const content = `
        <div class="content">
            <h2>Email Verified Successfully! ✅</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Great news! Your email address has been verified successfully.</p>
            <p>You can now enjoy full access to BookMyGame and start booking your favorite sports venues!</p>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">Start Booking Now</a>
            </div>
            
            <div class="highlight">
                <p style="margin: 0;"><strong>What's Next?</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Browse nearby sports venues</li>
                    <li>Book your favorite time slots</li>
                    <li>Join exciting sports events</li>
                    <li>Connect with other sports enthusiasts</li>
                </ul>
            </div>
        </div>
    `;

    return getBaseTemplate(content);
};

/**
 * Password Reset Template (for future use)
 */
const getPasswordResetTemplate = (userName, resetLink, expiryHours = 1) => {
    const content = `
        <div class="content">
            <h2>Reset Your Password 🔐</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password for your BookMyGame account.</p>
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <div class="highlight">
                <p style="margin: 0;"><strong>⏰ Important:</strong> This link will expire in <strong>${expiryHours} hour</strong>.</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px;">
                ${resetLink}
            </p>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #6c757d;">
                If you didn't request a password reset, please ignore this email or contact us if you have concerns.
            </p>
        </div>
    `;

    return getBaseTemplate(content);
};

module.exports = {
    getVerificationEmailTemplate,
    getVerificationSuccessTemplate,
    getPasswordResetTemplate,
};
