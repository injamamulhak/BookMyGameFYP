const prisma = require('../config/prisma');

/**
 * Sport Controller
 * Handles sport category operations
 */

/**
 * Get all sports
 * GET /api/sports
 */
const getSports = async (req, res) => {
    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: sports,
        });
    } catch (error) {
        console.error('Error fetching sports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sports',
        });
    }
};

/**
 * Create sport (admin only)
 * POST /api/sports
 */
const createSport = async (req, res) => {
    try {
        const { name, description, iconUrl } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Sport name is required',
            });
        }

        const sport = await prisma.sport.create({
            data: { name, description, iconUrl },
        });

        res.status(201).json({
            success: true,
            message: 'Sport created successfully',
            data: sport,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Sport with this name already exists',
            });
        }
        console.error('Error creating sport:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sport',
        });
    }
};

/**
 * Get all sports with venue counts
 * GET /api/sports/with-venue-counts
 */
const getSportsWithVenueCounts = async (req, res) => {
    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: {
                        venues: {
                            where: {
                                isActive: true,
                                approvalStatus: 'approved',
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Transform to include venueCount in a cleaner format
        const sportsWithCounts = sports.map(sport => ({
            id: sport.id,
            name: sport.name,
            description: sport.description,
            iconUrl: sport.iconUrl,
            venueCount: sport._count.venues,
        }));

        res.json({
            success: true,
            data: sportsWithCounts,
        });
    } catch (error) {
        console.error('Error fetching sports with venue counts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sports with venue counts',
        });
    }
};

module.exports = {
    getSports,
    createSport,
    getSportsWithVenueCounts,
};
