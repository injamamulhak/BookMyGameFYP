const prisma = require('../config/prisma');
const { getIo } = require('../socket');
const { computeRefundAmount, initiateKhaltiRefund, getRefundMessage } = require('../services/refund.service');
const emailService = require('../services/email.service');

/**
 * Booking Controller
 * Handles all booking-related operations for operators and users
 */

// ============================================
// OPERATOR ENDPOINTS
// ============================================

/**
 * Get all bookings for operator's venues
 * GET /api/bookings/operator
 */
const getOperatorBookings = async (req, res) => {
    try {
        const operatorId = req.user.id;
        const { venueId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get venue IDs for this operator
        const operatorVenues = await prisma.venue.findMany({
            where: { operatorId },
            select: { id: true },
        });
        const venueIds = operatorVenues.map(v => v.id);

        if (venueIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
            });
        }

        // Build date filter — merge into a single 'date' object to avoid spread overwriting
        const dateFilter = {};
        if (startDate) {
            // Start of the selected day (UTC midnight)
            dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            // End of the selected day (one millisecond before midnight next day)
            dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const where = {
            slot: {
                venueId: venueId ? venueId : { in: venueIds },
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
            },
            ...(status && { status }),
        };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                    slot: {
                        include: {
                            venue: { select: { id: true, name: true } },
                        },
                    },
                    payments: {
                        select: { id: true, amount: true, status: true, paymentMethod: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.booking.count({ where }),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching operator bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
        });
    }
};

/**
 * Get booking details by ID (operator)
 * GET /api/bookings/operator/:id
 */
const getOperatorBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, phone: true, profileImage: true },
                },
                slot: {
                    include: {
                        venue: {
                            select: { id: true, name: true, address: true, operatorId: true },
                        },
                    },
                },
                payments: true,
                review: true,
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check if operator owns this venue
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
        });
    }
};

/**
 * Confirm booking
 * PUT /api/bookings/operator/:id/confirm
 */
const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;

        // Get booking with venue info
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check ownership
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm booking with status: ${booking.status}`,
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'confirmed' },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                slot: { include: { venue: { select: { name: true } } } },
            },
        });

        // Send confirmation notification to user
        const notification = await prisma.notification.create({
            data: {
                userId: booking.userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: `Your booking at ${updatedBooking.slot.venue.name} has been confirmed.`,
                relatedEntityType: 'booking',
                relatedEntityId: booking.id
            }
        });

        try {
            getIo().to(booking.userId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting booking_confirmed:', socketErr);
        }

        res.json({
            success: true,
            message: 'Booking confirmed successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm booking',
        });
    }
};

/**
 * Cancel booking
 * PUT /api/bookings/operator/:id/cancel
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const operatorId = req.user.id;
        const { reason } = req.body;

        // Get booking with venue info
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                slot: {
                    include: { venue: { select: { operatorId: true } } },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check ownership
        if (booking.slot.venue.operatorId !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled',
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                notes: reason ? `Cancelled by operator: ${reason}` : 'Cancelled by operator',
            },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                slot: { include: { venue: { select: { name: true } } } },
            },
        });

        // Send cancellation notification to user
        const notification = await prisma.notification.create({
            data: {
                userId: booking.userId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                message: `Your booking at ${updatedBooking.slot.venue.name} was cancelled by the operator.`,
                relatedEntityType: 'booking',
                relatedEntityId: booking.id
            }
        });

        try {
            getIo().to(booking.userId).emit('new_notification', notification);
        } catch (socketErr) {
            console.error('Socket error emitting booking_cancelled:', socketErr);
        }
        // TODO: Handle refund if payment was made

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
        });
    }
};

/**
 * Get booking calendar for a venue
 * GET /api/bookings/operator/calendar/:venueId
 */
const getBookingCalendar = async (req, res) => {
    try {
        const { venueId } = req.params;
        const operatorId = req.user.id;
        const { startDate, endDate } = req.query;

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

        // Default to current month if dates not provided
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

        const timeSlots = await prisma.timeSlot.findMany({
            where: {
                venueId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                bookings: {
                    include: {
                        user: { select: { id: true, fullName: true } },
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });

        res.json({
            success: true,
            data: timeSlots,
            venue: { id: venue.id, name: venue.name },
            dateRange: { start, end },
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar',
        });
    }
};

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get user's own bookings
 * GET /api/bookings/my-bookings
 */
const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            userId,
            ...(status && { status }),
        };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    slot: {
                        include: {
                            venue: {
                                include: {
                                    images: { where: { isPrimary: true }, take: 1 }
                                },
                            },
                        },
                    },
                    payments: {
                        select: { status: true, amount: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.booking.count({ where }),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
        });
    }
};

/**
 * Get user booking details by ID
 * GET /api/bookings/my-bookings/:id
 */
const getUserBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await prisma.booking.findFirst({
            where: { id, userId },
            include: {
                slot: {
                    include: {
                        venue: {
                            include: {
                                operator: { select: { fullName: true, email: true, phone: true } },
                                images: { where: { isPrimary: true }, take: 1 },
                                sport: true,
                            },
                        },
                    },
                },
                payments: true,
                review: true,
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking details',
        });
    }
};

/**
 * Create new booking
 * POST /api/bookings
 * Supports two modes:
 * 1. slotId - Use existing time slot
 * 2. venueId + date + startTime + endTime - Create slot dynamically
 */
const createBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { slotId, venueId, date, startTime, endTime, totalPrice, notes } = req.dto;

        // Debug logging
        console.log('Creating booking with:', { slotId, venueId, date, startTime, endTime, totalPrice, userId });

        let slot;

        // Mode 1: Using existing slotId
        if (slotId) {
            slot = await prisma.timeSlot.findUnique({
                where: { id: slotId },
                include: {
                    venue: { select: { id: true, name: true, approvalStatus: true, isActive: true } },
                    bookings: { where: { status: { not: 'cancelled' } } },
                },
            });

            if (!slot) {
                return res.status(404).json({
                    success: false,
                    message: 'Time slot not found',
                });
            }

            if (slot.bookings.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This time slot is already booked',
                });
            }
        }
        // Mode 2: Using venueId + date + time (create slot dynamically)
        else if (venueId && date && startTime && endTime) {
            // Check venue exists and is available
            const venue = await prisma.venue.findUnique({
                where: { id: venueId },
                select: { id: true, name: true, approvalStatus: true, isActive: true, pricePerHour: true },
            });

            if (!venue) {
                return res.status(404).json({
                    success: false,
                    message: 'Venue not found',
                });
            }

            if (!venue.isActive || venue.approvalStatus !== 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Venue is not available for booking',
                });
            }

            // Check if slot already exists for this date/time
            // Parse time strings to Date format (handle both "14:00" and "1970-01-01T14:00:00.000Z" formats)
            const parseTimeToDate = (timeValue) => {
                if (!timeValue) return null;
                // If it's already a valid ISO date string
                const isoDate = new Date(timeValue);
                if (!isNaN(isoDate.getTime())) {
                    return isoDate;
                }
                // Otherwise treat as simple time string like "14:00"
                return new Date(`1970-01-01T${timeValue}:00.000Z`);
            };

            const parsedStartTime = parseTimeToDate(startTime);
            const parsedEndTime = parseTimeToDate(endTime);

            const existingSlot = await prisma.timeSlot.findFirst({
                where: {
                    venueId,
                    date: new Date(date),
                    startTime: parsedStartTime,
                    endTime: parsedEndTime,
                },
                include: {
                    bookings: { where: { status: { not: 'cancelled' } } },
                },
            });

            if (existingSlot) {
                if (existingSlot.bookings.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'This time slot is already booked',
                    });
                }
                slot = existingSlot;
            } else {
                // Create new time slot
                slot = await prisma.timeSlot.create({
                    data: {
                        venueId,
                        date: new Date(date),
                        startTime: parsedStartTime,
                        endTime: parsedEndTime,
                        price: totalPrice || venue.pricePerHour,
                    },
                    include: {
                        venue: { select: { id: true, name: true } },
                    },
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either slotId or (venueId, date, startTime, endTime) is required',
            });
        }

        // Check if venue is available
        if (slot.venue && (!slot.venue.isActive || slot.venue.approvalStatus !== 'approved')) {
            return res.status(400).json({
                success: false,
                message: 'Venue is not available for booking',
            });
        }

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                userId,
                slotId: slot.id,
                bookingDate: slot.date,
                totalPrice: totalPrice || slot.price,
                status: 'pending',
                notes,
            },
            include: {
                slot: {
                    include: { venue: { select: { id: true, name: true } } },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
        });
    }
};

/**
 * Cancel user's own booking
 * PUT /api/bookings/:id/cancel
 */
const cancelUserBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await prisma.booking.findFirst({
            where: { id, userId },
            include: {
                slot: {
                    include: {
                        venue: { select: { id: true, name: true, address: true, operatorId: true } },
                    },
                },
                payments: {
                    where: { status: 'completed' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                user: { select: { id: true, fullName: true, email: true } },
            },
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
        }

        // Build a full datetime for the booking start (date + startTime hours)
        const slotDate = new Date(booking.slot.date);
        const slotStart = new Date(booking.slot.startTime); // stored as 1970-01-01THH:mm
        const bookingStartDateTime = new Date(
            Date.UTC(
                slotDate.getUTCFullYear(),
                slotDate.getUTCMonth(),
                slotDate.getUTCDate(),
                slotStart.getUTCHours(),
                slotStart.getUTCMinutes(),
                0
            )
        );

        // Check if booking has already started
        if (bookingStartDateTime < new Date()) {
            return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has already started or passed' });
        }

        // Compute refund
        const paidPayment = booking.payments[0] || null;
        const paidAmount = paidPayment ? parseFloat(paidPayment.amount) : 0;
        const { refundPercent, refundAmount, tier } = computeRefundAmount(bookingStartDateTime, paidAmount);

        // Cancel booking
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                notes: booking.notes ? `${booking.notes} | Cancelled by user` : 'Cancelled by user',
            },
        });

        // Process refund if applicable
        let refundResult = null;
        if (paidPayment && refundAmount > 0) {
            // Get original pidx from gateway response
            const pidx = paidPayment.gatewayResponse?.pidx || paidPayment.transactionId;
            if (pidx) {
                refundResult = await initiateKhaltiRefund(pidx, refundAmount);
                // Update payment record with refund info
                await prisma.payment.update({
                    where: { id: paidPayment.id },
                    data: {
                        refundAmount,
                        refundedAt: new Date(),
                        refundStatus: refundResult.success ? 'initiated' : 'failed',
                        refundPidx: refundResult.refundPidx || null,
                    },
                });
            }
        }

        const refundMsg = getRefundMessage(tier, refundAmount);

        // Notify user in-app
        const userNotification = await prisma.notification.create({
            data: {
                userId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                message: `Your booking at ${booking.slot.venue.name} on ${slotDate.toDateString()} has been cancelled. ${refundMsg}`,
                relatedEntityType: 'booking',
                relatedEntityId: id,
            },
        });
        try { getIo().to(userId).emit('new_notification', userNotification); } catch (e) { /* ignore socket errors */ }

        // Notify operator in-app
        const opNotification = await prisma.notification.create({
            data: {
                userId: booking.slot.venue.operatorId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled by User',
                message: `${booking.user.fullName} has cancelled their booking at ${booking.slot.venue.name} on ${slotDate.toDateString()}.`,
                relatedEntityType: 'booking',
                relatedEntityId: id,
            },
        });
        try { getIo().to(booking.slot.venue.operatorId).emit('new_notification', opNotification); } catch (e) { /* ignore */ }

        // Send cancellation email to user
        try {
            await emailService.sendCancellationEmail(booking.user.email, {
                userName: booking.user.fullName,
                venueName: booking.slot.venue.name,
                bookingDate: slotDate,
                refundAmount,
                refundPercent,
                bookingId: id,
            });
        } catch (emailErr) { console.error('Cancellation email error:', emailErr); }

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: { ...updatedBooking, refundInfo: { refundPercent, refundAmount, tier, message: refundMsg } },
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }
};


/**
 * Create a walk-in booking as an operator
 * POST /api/bookings/operator/walk-in
 * Creates a TimeSlot (if not exists) and a confirmed Booking for it
 */
const createOperatorBooking = async (req, res) => {
    try {
        const operatorId = req.user.id;
        const { venueId, date, startTime, endTime, guestName, price } = req.body;

        if (!venueId || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'venueId, date, startTime, and endTime are required',
            });
        }

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

        // Parse times
        const parseTime = (t) => {
            if (t.includes('T')) return new Date(t);
            return new Date(`1970-01-01T${t}:00.000Z`);
        };

        const parsedDate = new Date(date);
        const parsedStart = parseTime(startTime);
        const parsedEnd = parseTime(endTime);

        // Find existing slot or create one
        let slot = await prisma.timeSlot.findFirst({
            where: {
                venueId,
                date: parsedDate,
                startTime: parsedStart,
                endTime: parsedEnd,
            },
            include: {
                bookings: { where: { status: { not: 'cancelled' } } },
            },
        });

        if (slot && slot.bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked',
            });
        }

        if (!slot) {
            slot = await prisma.timeSlot.create({
                data: {
                    venueId,
                    date: parsedDate,
                    startTime: parsedStart,
                    endTime: parsedEnd,
                    price: price || venue.pricePerHour,
                },
            });
        }

        // Create booking with operator as the user
        const booking = await prisma.booking.create({
            data: {
                userId: operatorId,
                slotId: slot.id,
                bookingDate: parsedDate,
                totalPrice: price || slot.price || venue.pricePerHour,
                status: 'confirmed',
                notes: `Walk-in booking by operator for: ${guestName || 'Walk-in Guest'}`,
            },
            include: {
                slot: {
                    include: { venue: { select: { id: true, name: true } } },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: `Walk-in booking created for ${guestName || 'Walk-in Guest'}`,
            data: booking,
        });
    } catch (error) {
        console.error('Error creating operator booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create walk-in booking',
        });
    }
};

module.exports = {
    // Operator
    getOperatorBookings,
    getOperatorBookingById,
    confirmBooking,
    cancelBooking,
    getBookingCalendar,
    createOperatorBooking,
    // User
    getUserBookings,
    getUserBookingById,
    createBooking,
    cancelUserBooking,
};
