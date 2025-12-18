require('dotenv').config();

const config = {
    // Server Configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Frontend URL for CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRE || '7d',
    },

    // Khalti Payment Configuration
    khalti: {
        secretKey: process.env.KHALTI_SECRET_KEY,
        publicKey: process.env.KHALTI_PUBLIC_KEY,
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    },
};

module.exports = config;
