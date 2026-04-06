const cron = require('node-cron');
const prisma = require('../config/prisma');
const { getIo } = require('../socket');

/**
 * Completed Booking Checker
 * Runs every day or every hour. Finds bookings that have "confirmed" status,
 * where the TimeSlot end time has already passed.
 * It will mark them as "completed" and notify the user to leave a review.
 */
const cleanupCompletedBookings = async () => {
    try {
        const now = new Date();

        // Find confirmed bookings whose TimeSlot endTime has passed
        const passedBookings = await prisma.booking.findMany({
            where: {
                status: 'confirmed',
                slot: {
                    date: { lte: now }, // date is today or earlier
                    // Wait, we need to make sure the combined date + endTime is in the past
                },
            },
            include: {
                slot: { include: { venue: true } },
                user: true,
            },
        });

        const bookingsToComplete = passedBookings.filter(b => {
            const slotDate = new Date(b.slot.date);
            const slotEndTime = new Date(b.slot.endTime);
            // Construct a complete Date object for the end time
            const combinedEndTime = new Date(
                slotDate.getFullYear(),
                slotDate.getMonth(),
                slotDate.getDate(),
                slotEndTime.getHours(),
                slotEndTime.getMinutes(),
                slotEndTime.getSeconds()
            );
            return combinedEndTime < now;
        });

        if (bookingsToComplete.length > 0) {
            console.log(`[BookingChecker] Marking ${bookingsToComplete.length} passed booking(s) as completed...`);

            for (const booking of bookingsToComplete) {
                try {
                    // Mark as completed
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { status: 'completed' },
                    });

                    // Check if already reviewed
                    const existingReview = await prisma.review.findUnique({
                        where: { bookingId: booking.id }
                    });

                    if (!existingReview) {
                        // Notify the user to leave a review
                        const notification = await prisma.notification.create({
                            data: {
                                userId: booking.userId,
                                type: 'leave_review',
                                title: 'How was your game?',
                                message: `Your booking at ${booking.slot.venue.name} has concluded. Please leave a review and let others know how it went!`,
                                relatedEntityType: 'venue',
                                relatedEntityId: booking.slot.venue.id,
                                link: `/venues/${booking.slot.venue.id}`,
                            },
                        });

                        try {
                            getIo().to(booking.userId).emit('new_notification', notification);
                        } catch (_) { /* ignore socket errors */ }
                    }

                    console.log(`[BookingChecker] Marked booking ${booking.id} as completed and asked for review`);
                } catch (bookingErr) {
                    console.error(`[BookingChecker] Error processing booking ${booking.id}:`, bookingErr.message);
                }
            }
        }
    } catch (err) {
        console.error('[BookingChecker] Unexpected error:', err.message);
    }
};

/**
 * Start the cron job
 * Runs every hour on the hour (* * * * * for testing, 0 * * * * for production but 
 * we can just run it every 15 minutes to be responsive without overloading)
 */
const startCompletedBookingChecker = () => {
    console.log(`[BookingChecker] Started — checking for completed bookings every 15 minutes`);

    cron.schedule('*/15 * * * *', cleanupCompletedBookings, {
        scheduled: true,
        timezone: 'Asia/Kathmandu',
    });
};

module.exports = { startCompletedBookingChecker, cleanupCompletedBookings };
