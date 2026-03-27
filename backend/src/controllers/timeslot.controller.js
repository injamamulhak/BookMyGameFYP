const prisma = require('../config/prisma');

/**
 * TimeSlot Controller
 * Handles time slot management for venues
 */

/**
 * Helper function to check if a time slot overlaps with an event
 * @param {Date} slotDate - The date of the time slot
 * @param {Date} slotStart - The start time of the slot (Time only)
 * @param {Date} slotEnd - The end time of the slot (Time only)
 * @param {Object} event - The event object with startDate, endDate, startTime, endTime
 * @returns {boolean} - True if there's an overlap
 */
const doesSlotOverlapWithEvent = (slotDate, slotStart, slotEnd, event) => {
    // Extract time portions for comparison (HH:MM format)
    const getTimeMinutes = (timeDate) => {
        const d = new Date(timeDate);
        return d.getUTCHours() * 60 + d.getUTCMinutes();
    };

    const slotDateStr = slotDate.toISOString().split('T')[0];
    const slotStartMinutes = getTimeMinutes(slotStart);
    const slotEndMinutes = getTimeMinutes(slotEnd);

    // EXACT SLOTS RESERVATION: If event has precise slots stored in JSON, use those.
    if (event.slots && Array.isArray(event.slots) && event.slots.length > 0) {
        for (const scheduledSlot of event.slots) {
            if (scheduledSlot.date === slotDateStr) {
                const [sh, sm] = scheduledSlot.startTime.split(':').map(Number);
                const [eh, em] = scheduledSlot.endTime.split(':').map(Number);
                const schedStartMins = sh * 60 + sm;
                const schedEndMins = eh * 60 + em;
                
                // Overlap occurs if slot starts before schedEnd AND ends after schedStart
                if (slotStartMinutes < schedEndMins && slotEndMinutes > schedStartMins) {
                    return true;
                }
            }
        }
        return false;
    }

    // FALLBACK for older events without exact slots array
    const eventStartStr = new Date(event.startDate).toISOString().split('T')[0];
    const eventEndStr = new Date(event.endDate).toISOString().split('T')[0];

    if (slotDateStr < eventStartStr || slotDateStr > eventEndStr) {
        return false;
    }

    if (!event.startTime || !event.endTime) {
        return true;
    }

    const eventStartMinutes = getTimeMinutes(event.startTime);
    const eventEndMinutes = getTimeMinutes(event.endTime);

    return slotStartMinutes < eventEndMinutes && slotEndMinutes > eventStartMinutes;
};

/**
 * Get available time slots for a venue
 * GET /api/timeslots/venue/:venueId
 * 
 * NOTE: This now ONLY returns BOOKED slots or slots blocked by EVENTS.
 * The frontend is responsible for generating the grid based on operating hours.
 */
const getVenueTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { date, startDate, endDate } = req.query;

        // Build date filter
        let dateFilter = {};
        let eventDateFilter = {};

        if (date) {
            // Use a range to cover the full 24h of the requested date (avoids timezone exact-match failures)
            const dayStart = new Date(`${date}T00:00:00.000Z`);
            const dayEnd = new Date(`${date}T23:59:59.999Z`);
            dateFilter = { date: { gte: dayStart, lte: dayEnd } };
            eventDateFilter = {
                startDate: { lte: dayEnd },
                endDate: { gte: dayStart },
            };
        } else if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
            dateFilter = { date: { gte: start, lte: end } };
            eventDateFilter = {
                startDate: { lte: end },
                endDate: { gte: start },
            };
        } else {
            // Default to next 30 days for a broader view
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const nextMonth = new Date(today);
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 30);
            nextMonth.setUTCHours(23, 59, 59, 999);
            dateFilter = { date: { gte: today, lte: nextMonth } };
            eventDateFilter = {
                startDate: { lte: nextMonth },
                endDate: { gte: today },
            };
        }

        // Fetch time slots (which represent bookings/blocks) and events
        const [timeSlots, venueEvents] = await Promise.all([
            prisma.timeSlot.findMany({
                where: {
                    venueId,
                    ...dateFilter,
                },
                include: {
                    bookings: {
                        where: { status: { not: 'cancelled' } },
                        select: { id: true, status: true, userId: true },
                    },
                },
                orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.event.findMany({
                where: {
                    venueId,
                    ...eventDateFilter,
                },
                select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    startTime: true,
                    endTime: true,
                    slots: true,
                },
            }),
        ]);

        // Filter out slots that have no active bookings and are not blocked by events
        // (Unless they were manually created by operator - but we're moving to dynamic)
        const activeSlots = timeSlots.map(slot => {
            const hasBooking = slot.bookings.length > 0;

            // Check if slot overlaps with any event
            let blockedByEvent = null;
            for (const event of venueEvents) {
                if (doesSlotOverlapWithEvent(slot.date, slot.startTime, slot.endTime, event)) {
                    blockedByEvent = {
                        eventId: event.id,
                        eventTitle: event.title,
                    };
                    break;
                }
            }

            return {
                ...slot,
                isAvailable: !hasBooking && !blockedByEvent,
                blockedByEvent,
            };
        });

        res.json({
            success: true,
            data: activeSlots,
            events: venueEvents // Also send events for frontend to block slots
        });
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch time slots',
        });
    }
};

/**
 * Update time slot (operator)
 * PUT /api/timeslots/operator/:id
 */
const updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const { price, date, startTime, endTime } = req.body;

        // Get slot with venue info
        const slot = await prisma.timeSlot.findUnique({
            where: { id },
            include: { venue: { select: { operatorId: true } } },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Time slot not found',
            });
        }

        if (slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const updatedSlot = await prisma.timeSlot.update({
            where: { id },
            data: {
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(date && { date: new Date(date) }),
                ...(startTime && { startTime: new Date(startTime.includes('T') ? startTime : `1970-01-01T${startTime}:00.000Z`) }),
                ...(endTime && { endTime: new Date(endTime.includes('T') ? endTime : `1970-01-01T${endTime}:00.000Z`) }),
            },
        });

        res.json({
            success: true,
            message: 'Time slot updated successfully',
            data: updatedSlot,
        });
    } catch (error) {
        console.error('Error updating time slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update time slot',
        });
    }
};

/**
 * Delete time slot (operator)
 * DELETE /api/timeslots/operator/:id
 */
const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Get slot with venue info and bookings
        const slot = await prisma.timeSlot.findUnique({
            where: { id },
            include: {
                venue: { select: { operatorId: true } },
                bookings: { where: { status: { not: 'cancelled' } } },
            },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Time slot not found',
            });
        }

        if (slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (slot.bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete slot with active bookings',
            });
        }

        await prisma.timeSlot.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Time slot deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting time slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete time slot',
        });
    }
};

/**
 * Bulk delete time slots (operator)
 * DELETE /api/timeslots/operator/venue/:venueId/bulk
 */
const bulkDeleteTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { slotIds, startDate, endDate } = req.body;

        // Check venue ownership
        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        let deleteWhere = { venueId };

        if (slotIds && slotIds.length > 0) {
            deleteWhere.id = { in: slotIds };
        } else if (startDate && endDate) {
            deleteWhere.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Provide either slotIds or date range',
            });
        }

        // Only delete slots without active bookings
        deleteWhere.bookings = { none: { status: { not: 'cancelled' } } };

        const deleted = await prisma.timeSlot.deleteMany({ where: deleteWhere });

        res.json({
            success: true,
            message: `${deleted.count} time slot(s) deleted successfully`,
        });
    } catch (error) {
        console.error('Error bulk deleting time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete time slots',
        });
    }
};

/**
 * Create time slots for a venue (operator)
 * POST /api/timeslots/operator/venue/:venueId
 */
const createTimeSlots = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { slots } = req.body; // Array of { date, startTime, endTime, price }

        // Check venue ownership
        const venue = await prisma.venue.findFirst({
            where: { id: venueId, operatorId },
        });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found or access denied',
            });
        }

        if (!slots || slots.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one slot is required',
            });
        }

        // Create slots
        const createdSlots = await prisma.timeSlot.createMany({
            data: slots.map(slot => ({
                venueId,
                date: new Date(slot.date),
                startTime: new Date(slot.startTime.includes('T') ? slot.startTime : `1970-01-01T${slot.startTime}:00.000Z`),
                endTime: new Date(slot.endTime.includes('T') ? slot.endTime : `1970-01-01T${slot.endTime}:00.000Z`),
                price: slot.price || venue.pricePerHour,
            })),
            skipDuplicates: true,
        });

        res.status(201).json({
            success: true,
            message: `${createdSlots.count} time slot(s) created successfully`,
        });
    } catch (error) {
        console.error('Error creating time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create time slots',
        });
    }
};

/**
 * Lock a time slot for 90 seconds
 * POST /api/timeslots/:id/lock
 */
const lockSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const LOCK_DURATION_MS = 90 * 1000; // 90 seconds

        let slot;

        // Check if this is a dynamically generated client-side ID
        const isDynamicId = id.startsWith('slot-');

        if (isDynamicId) {
            const { venueId, date, startTime, endTime, price } = req.body;

            if (!venueId || !date || !startTime || !endTime) {
                return res.status(400).json({ success: false, message: 'Missing slot details for dynamic creation' });
            }

            const searchDate = new Date(date);
            const searchStart = new Date(`1970-01-01T${startTime}:00.000Z`);
            
            // Try to see if it already exists
            slot = await prisma.timeSlot.findFirst({
                where: { venueId, date: searchDate, startTime: searchStart },
                include: { bookings: { where: { status: { not: 'cancelled' } } } },
            });

            if (!slot) {
                // Create and immediately lock it
                const now = new Date();
                slot = await prisma.timeSlot.create({
                    data: {
                        venueId,
                        date: searchDate,
                        startTime: searchStart,
                        endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
                        price: parseFloat(price || 0),
                        lockedBy: userId,
                        lockedAt: now
                    },
                    include: { bookings: { where: { status: { not: 'cancelled' } } } }
                });

                return res.json({
                    success: true,
                    message: 'Slot created and locked for 90 seconds',
                    data: { 
                        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS).toISOString(),
                        lockedSlotId: slot.id
                    },
                });
            }
        } else {
            slot = await prisma.timeSlot.findUnique({
                where: { id },
                include: { bookings: { where: { status: { not: 'cancelled' } } } },
            });
        }

        if (!slot) {
            return res.status(404).json({ success: false, message: 'Time slot not found' });
        }

        if (slot.bookings.length > 0) {
            return res.status(400).json({ success: false, message: 'Time slot is already booked' });
        }

        // Check if slot is locked by another user (and lock hasn't expired)
        const now = new Date();
        if (slot.lockedBy && slot.lockedBy !== userId && slot.lockedAt) {
            const lockExpiry = new Date(slot.lockedAt.getTime() + LOCK_DURATION_MS);
            if (now < lockExpiry) {
                const secondsRemaining = Math.ceil((lockExpiry - now) / 1000);
                return res.status(409).json({
                    success: false,
                    message: `This slot is temporarily held by another user. Try again in ${secondsRemaining} seconds.`,
                    secondsRemaining,
                });
            }
        }

        // Lock the slot
        const updatedSlot = await prisma.timeSlot.update({
            where: { id: slot.id },
            data: { lockedBy: userId, lockedAt: now },
        });

        res.json({
            success: true,
            message: 'Slot locked for 90 seconds',
            data: { 
                lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS).toISOString(),
                lockedSlotId: slot.id
            },
        });
    } catch (error) {
        console.error('Error locking slot:', error);
        res.status(500).json({ success: false, message: 'Failed to lock slot' });
    }
};

/**
 * Unlock a time slot (release the hold)
 * POST /api/timeslots/:id/unlock
 */
const unlockSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const slot = await prisma.timeSlot.findUnique({ where: { id } });

        if (!slot) {
            return res.status(404).json({ success: false, message: 'Time slot not found' });
        }

        // Only the locking user can explicitly unlock
        if (slot.lockedBy && slot.lockedBy !== userId) {
            return res.status(403).json({ success: false, message: 'You do not hold this slot' });
        }

        await prisma.timeSlot.update({
            where: { id },
            data: { lockedBy: null, lockedAt: null },
        });

        res.json({ success: true, message: 'Slot released' });
    } catch (error) {
        console.error('Error unlocking slot:', error);
        res.status(500).json({ success: false, message: 'Failed to unlock slot' });
    }
};

module.exports = {
    getVenueTimeSlots,
    createTimeSlots,
    updateTimeSlot,
    deleteTimeSlot,
    lockSlot,
    unlockSlot,
};
