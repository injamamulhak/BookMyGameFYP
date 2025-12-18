const prisma = require('../config/prisma');

/**
 * Example Venue Controller using Prisma
 * Demonstrates advanced queries with relations
 */

// Get all venues with filters
const getVenues = async (req, res) => {
    try {
        const { city, sport, search } = req.query;

        const venues = await prisma.venue.findMany({
            where: {
                isActive: true,
                ...(city && { city }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                }),
                ...(sport && {
                    courts: {
                        some: {
                            sportCategory: {
                                name: { equals: sport, mode: 'insensitive' },
                            },
                        },
                    },
                }),
            },
            include: {
                courts: {
                    include: {
                        sportCategory: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
            orderBy: {
                rating: 'desc',
            },
        });

        res.json({
            success: true,
            data: venues,
            count: venues.length,
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venues',
        });
    }
};

// Get venue details with all relations
const getVenueById = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await prisma.venue.findUnique({
            where: { id: parseInt(id) },
            include: {
                courts: {
                    where: { isActive: true },
                    include: {
                        sportCategory: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                    },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                events: {
                    where: {
                        eventDate: {
                            gte: new Date(),
                        },
                    },
                    orderBy: {
                        eventDate: 'asc',
                    },
                },
            },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found',
            });
        }

        res.json({
            success: true,
            data: venue,
        });
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venue',
        });
    }
};

// Create new venue
const createVenue = async (req, res) => {
    try {
        const { ownerId, name, description, address, city, ...rest } = req.body;

        const venue = await prisma.venue.create({
            data: {
                ownerId,
                name,
                description,
                address,
                city,
                ...rest,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Venue created successfully',
            data: venue,
        });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create venue',
        });
    }
};

module.exports = {
    getVenues,
    getVenueById,
    createVenue,
};
