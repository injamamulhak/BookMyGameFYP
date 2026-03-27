const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Training Video Controller
 * Public: browse/filter videos by sport & difficulty
 * Admin: full CRUD management
 */

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Get all active training videos with filters
 * Public - anyone can view
 */
const getAllVideos = async (req, res) => {
    try {
        const {
            sportId,
            difficultyLevel,
            search,
            page = 1,
            limit = 12
        } = req.query;

        const where = { isActive: true };

        if (sportId) {
            where.sportId = sportId;
        }

        if (difficultyLevel && difficultyLevel !== 'all') {
            where.difficultyLevel = difficultyLevel;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [videos, total] = await Promise.all([
            prisma.trainingVideo.findMany({
                where,
                include: {
                    sport: {
                        select: { id: true, name: true, iconUrl: true }
                    }
                },
                orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: parseInt(limit)
            }),
            prisma.trainingVideo.count({ where })
        ]);

        res.json({
            success: true,
            data: videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching training videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training videos' });
    }
};

/**
 * Get a single training video by ID and increment view count
 * Public
 */
const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await prisma.trainingVideo.findUnique({
            where: { id, isActive: true },
            include: {
                sport: { select: { id: true, name: true, iconUrl: true } }
            }
        });

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Increment view count asynchronously (don't await)
        prisma.trainingVideo.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        }).catch(err => console.error('Failed to increment view count:', err));

        res.json({ success: true, data: video });
    } catch (error) {
        console.error('Error fetching training video:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training video' });
    }
};

/**
 * Get featured / popular videos for the landing page (top viewed)
 * Public
 */
const getFeaturedVideos = async (req, res) => {
    try {
        const videos = await prisma.trainingVideo.findMany({
            where: { isActive: true },
            include: {
                sport: { select: { id: true, name: true, iconUrl: true } }
            },
            orderBy: { viewCount: 'desc' },
            take: 6
        });

        res.json({ success: true, data: videos });
    } catch (error) {
        console.error('Error fetching featured videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured videos' });
    }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get all training videos (including inactive) — Admin
 */
const adminGetAllVideos = async (req, res) => {
    try {
        const { page = 1, limit = 20, sportId, difficultyLevel, search } = req.query;

        const where = {};
        if (sportId) where.sportId = sportId;
        if (difficultyLevel && difficultyLevel !== 'all') where.difficultyLevel = difficultyLevel;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [videos, total] = await Promise.all([
            prisma.trainingVideo.findMany({
                where,
                include: {
                    sport: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.trainingVideo.count({ where })
        ]);

        res.json({
            success: true,
            data: videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching videos (admin):', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training videos' });
    }
};

/**
 * Create a new training video — Admin
 */
const createVideo = async (req, res) => {
    try {
        const {
            title,
            description,
            videoUrl,
            thumbnailUrl,
            sportId,
            difficultyLevel,
            duration,
            isActive = true
        } = req.body;

        if (!title || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Title and video URL are required' });
        }

        const video = await prisma.trainingVideo.create({
            data: {
                title,
                description,
                videoUrl,
                thumbnailUrl,
                sportId: sportId || null,
                difficultyLevel: difficultyLevel || null,
                duration: duration ? parseInt(duration) : null,
                isActive
            },
            include: {
                sport: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ success: true, data: video, message: 'Training video created successfully' });
    } catch (error) {
        console.error('Error creating training video:', error);
        res.status(500).json({ success: false, message: 'Failed to create training video' });
    }
};

/**
 * Update a training video — Admin
 */
const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            videoUrl,
            thumbnailUrl,
            sportId,
            difficultyLevel,
            duration,
            isActive
        } = req.body;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
        if (sportId !== undefined) updateData.sportId = sportId || null;
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel || null;
        if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const video = await prisma.trainingVideo.update({
            where: { id },
            data: updateData,
            include: { sport: { select: { id: true, name: true } } }
        });

        res.json({ success: true, data: video, message: 'Training video updated successfully' });
    } catch (error) {
        console.error('Error updating training video:', error);
        res.status(500).json({ success: false, message: 'Failed to update training video' });
    }
};

/**
 * Delete a training video — Admin
 */
const deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }

        await prisma.trainingVideo.delete({ where: { id } });

        res.json({ success: true, message: 'Training video deleted successfully' });
    } catch (error) {
        console.error('Error deleting training video:', error);
        res.status(500).json({ success: false, message: 'Failed to delete training video' });
    }
};

module.exports = {
    getAllVideos,
    getVideoById,
    getFeaturedVideos,
    adminGetAllVideos,
    createVideo,
    updateVideo,
    deleteVideo
};
