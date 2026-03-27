const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

/**
 * General Upload Routes
 * POST /api/uploads/image - Upload a single image (authenticated)
 */

router.post('/image', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // The file URL is available from the upload middleware
        // For local: we construct the URL and fix Windows backslashes
        let imageUrl = req.file.path;
        if (!imageUrl.includes('cloudinary.com')) {
            imageUrl = '/' + imageUrl.replace(/\\/g, '/');
        }

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            url: imageUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
