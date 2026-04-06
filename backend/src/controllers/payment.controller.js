const prisma = require('../config/prisma');
const config = require('../config');
const axios = require('axios');
const { getIo } = require('../socket');
const emailService = require('../services/email.service');

/**
 * Payment Controller
 * Handles Khalti payment gateway integration
 */

// Khalti Sandbox API Base URL
const KHALTI_API_URL = 'https://a.khalti.com/api/v2';

/**
 * Initiate Khalti Payment
 * POST /api/payments/khalti/initiate
 * 
 * Creates a payment request and returns Khalti payment URL
 */
const initiateKhaltiPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingIds, amount, returnUrl } = req.body;

        if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one booking ID is required',
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        // Verify bookings exist and belong to user
        const bookings = await prisma.booking.findMany({
            where: {
                id: { in: bookingIds },
                userId,
                status: 'pending',
            },
            include: {
                slot: {
                    include: {
                        venue: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (bookings.length !== bookingIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more bookings not found or not in pending status',
            });
        }

        // Get user details for Khalti
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, phone: true },
        });

        // Create a unique purchase order ID
        const purchaseOrderId = `BMG-${Date.now()}-${userId.slice(-6)}`;
        const purchaseOrderName = `Booking for ${bookings[0].slot.venue.name}`;

        // Prepare Khalti payload
        // Note: Khalti expects amount in paisa (1 NPR = 100 paisa)
        const khaltiPayload = {
            return_url: returnUrl || `${config.frontendUrl}/payment/callback`,
            website_url: config.frontendUrl,
            amount: Math.round(amount * 100), // Convert to paisa
            purchase_order_id: purchaseOrderId,
            purchase_order_name: purchaseOrderName,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: user.phone || '9800000000', // Default if no phone
            },
        };

        // Call Khalti API to initiate payment
        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiPayload,
            {
                headers: {
                    'Authorization': `Key ${config.khalti.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!khaltiResponse.data || !khaltiResponse.data.payment_url) {
            throw new Error('Invalid response from Khalti');
        }

        // Create payment records for each booking
        const paymentData = bookings.map(booking => ({
            bookingId: booking.id,
            userId,
            amount: parseFloat(booking.totalPrice),
            paymentMethod: 'khalti',
            transactionId: khaltiResponse.data.pidx,
            status: 'pending',
            gatewayResponse: {
                pidx: khaltiResponse.data.pidx,
                purchaseOrderId,
                initiatedAt: new Date().toISOString(),
            },
        }));

        await prisma.payment.createMany({
            data: paymentData,
        });

        res.json({
            success: true,
            message: 'Payment initiated successfully',
            data: {
                paymentUrl: khaltiResponse.data.payment_url,
                pidx: khaltiResponse.data.pidx,
                purchaseOrderId,
                expiresAt: khaltiResponse.data.expires_at,
            },
        });
    } catch (error) {
        console.error('Error initiating Khalti payment:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment',
            error: error.response?.data?.detail || error.message,
        });
    }
};

/**
 * Initiate Khalti Payment for Event Registration
 * POST /api/payments/khalti/initiate-event
 */
const initiateEventPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { registrationId, amount, returnUrl } = req.body;

        if (!registrationId) {
            return res.status(400).json({ success: false, message: 'Registration ID is required' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        // Verify registration exists, belongs to user, and is pending
        const registration = await prisma.eventRegistration.findFirst({
            where: { id: registrationId, userId, paymentStatus: 'pending' },
            include: {
                event: { select: { id: true, title: true, venue: { select: { name: true } } } },
            },
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found, already paid, or does not belong to you',
            });
        }

        // Get user details for Khalti
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, phone: true },
        });

        const purchaseOrderId = `EVT-${Date.now()}-${userId.slice(-6)}`;
        const purchaseOrderName = `Event: ${registration.event.title}`;

        const khaltiPayload = {
            return_url: returnUrl || `${config.frontendUrl}/payment/callback?type=event`,
            website_url: config.frontendUrl,
            amount: Math.round(amount * 100), // paisa
            purchase_order_id: purchaseOrderId,
            purchase_order_name: purchaseOrderName,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: user.phone || '9800000000',
            },
        };

        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiPayload,
            { headers: { 'Authorization': `Key ${config.khalti.secretKey}`, 'Content-Type': 'application/json' } }
        );

        if (!khaltiResponse.data || !khaltiResponse.data.payment_url) {
            throw new Error('Invalid response from Khalti');
        }

        // Create payment record linked to registration
        await prisma.payment.create({
            data: {
                registrationId,
                userId,
                amount: parseFloat(amount),
                paymentMethod: 'khalti',
                transactionId: khaltiResponse.data.pidx,
                status: 'pending',
                gatewayResponse: {
                    pidx: khaltiResponse.data.pidx,
                    purchaseOrderId,
                    initiatedAt: new Date().toISOString(),
                },
            },
        });

        res.json({
            success: true,
            message: 'Event payment initiated successfully',
            data: {
                paymentUrl: khaltiResponse.data.payment_url,
                pidx: khaltiResponse.data.pidx,
                purchaseOrderId,
                expiresAt: khaltiResponse.data.expires_at,
            },
        });
    } catch (error) {
        console.error('Error initiating event payment:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate event payment',
            error: error.response?.data?.detail || error.message,
        });
    }
};

/**
 * Verify Khalti Payment (Callback)
 * GET /api/payments/khalti/verify
 * 
 * Called after user completes payment on Khalti
 * Verifies payment status and updates booking
 */
const verifyKhaltiPayment = async (req, res) => {
    try {
        const { pidx, status, transaction_id, purchase_order_id } = req.query;

        if (!pidx) {
            return res.status(400).json({
                success: false,
                message: 'Payment identifier (pidx) is required',
            });
        }

        // Lookup payment by pidx (stored in transactionId)
        const payments = await prisma.payment.findMany({
            where: { transactionId: pidx },
            include: {
                booking: true,
            },
        });

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found',
            });
        }

        // If already completed, return success
        if (payments[0].status === 'completed') {
            return res.json({
                success: true,
                message: 'Payment already verified',
                data: { status: 'completed', bookingIds: payments.map(p => p.bookingId) },
            });
        }

        // If the frontend explicitly reports cancellation, skip Khalti lookup to avoid errors
        // and immediately clean up pending records.
        if (status === 'Canceled' || status === 'User canceled') {
            await prisma.payment.updateMany({
                where: { transactionId: pidx },
                data: {
                    status: 'failed',
                    gatewayResponse: {
                        ...payments[0].gatewayResponse,
                        failedAt: new Date().toISOString(),
                        khaltiStatus: status,
                    },
                },
            });

            const bookingIds = payments.map(p => p.bookingId).filter(Boolean);
            if (bookingIds.length > 0) {
                await prisma.booking.deleteMany({
                    where: { id: { in: bookingIds }, status: 'pending' },
                });
            }

            const registrationIds = payments.map(p => p.registrationId).filter(Boolean);
            if (registrationIds.length > 0) {
                await prisma.eventRegistration.deleteMany({
                    where: { id: { in: registrationIds }, paymentStatus: 'pending' },
                });
            }

            return res.json({
                success: false,
                message: 'Payment was cancelled. Any pending registrations or bookings have been cleared.',
                data: { status: 'failed', khaltiStatus: status },
            });
        }

        // Verify with Khalti API
        const verifyResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/lookup/`,
            { pidx },
            {
                headers: {
                    'Authorization': `Key ${config.khalti.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const khaltiStatus = verifyResponse.data.status;

        if (khaltiStatus === 'Completed') {
            // Update all payment records
            await prisma.payment.updateMany({
                where: { transactionId: pidx },
                data: {
                    status: 'completed',
                    gatewayResponse: {
                        ...payments[0].gatewayResponse,
                        verifiedAt: new Date().toISOString(),
                        khaltiTransactionId: verifyResponse.data.transaction_id,
                        khaltiStatus: khaltiStatus,
                        totalAmount: verifyResponse.data.total_amount,
                        fee: verifyResponse.data.fee,
                    },
                },
            });

            // ── Venue Booking flow ──
            const bookingIds = payments.map(p => p.bookingId).filter(Boolean);
            if (bookingIds.length > 0) {
                await prisma.booking.updateMany({
                    where: { id: { in: bookingIds } },
                    data: { status: 'confirmed' },
                });
            }

            // ── Event Registration flow ──
            const registrationIds = payments.map(p => p.registrationId).filter(Boolean);
            if (registrationIds.length > 0) {
                await prisma.eventRegistration.updateMany({
                    where: { id: { in: registrationIds } },
                    data: { paymentStatus: 'completed' },
                });

                const confirmedRegs = await prisma.eventRegistration.findMany({
                    where: { id: { in: registrationIds } },
                    include: {
                        user: { select: { id: true, fullName: true, email: true } },
                        event: {
                            include: {
                                venue: {
                                    select: { id: true, name: true, address: true, operatorId: true },
                                },
                            },
                        },
                        payments: { where: { transactionId: pidx }, take: 1 },
                    },
                });

                for (const reg of confirmedRegs) {
                    // Notify user
                    const userNotif = await prisma.notification.create({
                        data: {
                            userId: reg.userId,
                            type: 'payment_success',
                            title: 'Payment Successful – Event Registration Confirmed!',
                            message: `Your payment for "${reg.event.title}" is confirmed. Check your email for the receipt.`,
                            relatedEntityType: 'event',
                            relatedEntityId: reg.event.id,
                            link: '/my-events',
                        },
                    });
                    try { getIo().to(reg.userId).emit('new_notification', userNotif); } catch (e) { /* ignore */ }

                    // Notify operator
                    const opNotif = await prisma.notification.create({
                        data: {
                            userId: reg.event.venue.operatorId,
                            type: 'new_event_registration',
                            title: 'New Paid Event Registration',
                            message: `${reg.user.fullName} paid and registered for "${reg.event.title}".`,
                            relatedEntityType: 'event',
                            relatedEntityId: reg.event.id,
                            link: `/operator/events/${reg.event.id}`,
                        },
                    });
                    try { getIo().to(reg.event.venue.operatorId).emit('new_notification', opNotif); } catch (e) { /* ignore */ }

                    // Send QR email receipt
                    try {
                        await emailService.sendEventRegistrationReceipt(reg.user.email, {
                            userName: reg.user.fullName,
                            userEmail: reg.user.email,
                            registrationId: reg.id,
                            eventTitle: reg.event.title,
                            venueName: reg.event.venue.name,
                            venueAddress: reg.event.venue.address,
                            startDate: reg.event.startDate,
                            endDate: reg.event.endDate,
                            amount: reg.payments[0]?.amount || 0,
                            transactionId: verifyResponse.data.transaction_id,
                        });
                    } catch (emailErr) { console.error('Event receipt email error:', emailErr); }
                }
            }

            // ── Fetch full booking details for receipt / notifications ──
            const confirmedBookings = await prisma.booking.findMany({
                where: { id: { in: bookingIds } },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    slot: {
                        include: {
                            venue: {
                                select: { id: true, name: true, address: true, operatorId: true, operator: { select: { fullName: true } } },
                            },
                        },
                    },
                    payments: { where: { transactionId: pidx }, take: 1 },
                },
            });

            // Send notifications and receipt for each booking
            for (const booking of confirmedBookings) {
                // In-app notification for user
                const userNotif = await prisma.notification.create({
                    data: {
                        userId: booking.userId,
                        type: 'payment_success',
                        title: 'Payment Successful – Booking Confirmed!',
                        message: `Your payment of Rs. ${booking.totalPrice} for ${booking.slot.venue.name} has been confirmed. Check your email for the receipt.`,
                        relatedEntityType: 'booking',
                        relatedEntityId: booking.id,
                        link: `/my-bookings/${booking.id}`,
                    },
                });
                try { getIo().to(booking.userId).emit('new_notification', userNotif); } catch (e) { /* ignore */ }

                // In-app notification for operator
                const opNotif = await prisma.notification.create({
                    data: {
                        userId: booking.slot.venue.operatorId,
                        type: 'new_booking',
                        title: 'New Booking Confirmed',
                        message: `${booking.user.fullName} has confirmed a booking at ${booking.slot.venue.name}. Payment: Rs. ${booking.totalPrice}.`,
                        relatedEntityType: 'booking',
                        relatedEntityId: booking.id,
                        link: `/operator/bookings/${booking.id}`,
                    },
                });
                try { getIo().to(booking.slot.venue.operatorId).emit('new_notification', opNotif); } catch (e) { /* ignore */ }

                // Send QR receipt email to user
                try {
                    await emailService.sendBookingReceipt(booking.user.email, {
                        userName: booking.user.fullName,
                        userEmail: booking.user.email,
                        bookingId: booking.id,
                        venueName: booking.slot.venue.name,
                        venueAddress: booking.slot.venue.address,
                        operatorName: booking.slot.venue.operator?.fullName,
                        bookingDate: booking.slot.date,
                        startTime: booking.slot.startTime,
                        endTime: booking.slot.endTime,
                        totalPrice: booking.totalPrice,
                        bookingType: 'venue',
                        transactionId: verifyResponse.data.transaction_id,
                    });
                } catch (emailErr) { console.error('Receipt email error:', emailErr); }
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    status: 'completed',
                    bookingIds,
                    transactionId: verifyResponse.data.transaction_id,
                },
            });
        } else if (khaltiStatus === 'Pending') {
            // Payment is still pending at Khalti — do NOT confirm the booking
            // but also do NOT delete it yet. Return pending so frontend can retry briefly.
            res.json({
                success: false,
                message: 'Payment is still pending at Khalti. Please wait or try again.',
                data: { status: 'pending' },
            });
        } else {
            // Payment failed or cancelled
            await prisma.payment.updateMany({
                where: { transactionId: pidx },
                data: {
                    status: 'failed',
                    gatewayResponse: {
                        ...payments[0].gatewayResponse,
                        failedAt: new Date().toISOString(),
                        khaltiStatus: khaltiStatus,
                    },
                },
            });

            // Clean up pending bookings
            const bookingIds = payments.map(p => p.bookingId).filter(Boolean);
            if (bookingIds.length > 0) {
                await prisma.booking.deleteMany({
                    where: { id: { in: bookingIds }, status: 'pending' },
                });
            }

            // Clean up pending event registrations
            const registrationIds = payments.map(p => p.registrationId).filter(Boolean);
            if (registrationIds.length > 0) {
                await prisma.eventRegistration.deleteMany({
                    where: { id: { in: registrationIds }, paymentStatus: 'pending' },
                });
            }

            res.json({
                success: false,
                message: 'Payment was not completed. Any pending bookings have been cancelled.',
                data: { status: 'failed', khaltiStatus },
            });
        }
    } catch (error) {
        console.error('Error verifying Khalti payment:', error.response?.data || error.message);

        // If Khalti server is unreachable or throws, clean up pending records
        // to avoid leaving users with ghost "pending" bookings/registrations.
        try {
            const { pidx } = req.query;
            if (pidx) {
                const pendingPayments = await prisma.payment.findMany({
                    where: { transactionId: pidx, status: 'pending' },
                });

                if (pendingPayments.length > 0) {
                    // Mark payments as failed
                    await prisma.payment.updateMany({
                        where: { transactionId: pidx, status: 'pending' },
                        data: {
                            status: 'failed',
                            gatewayResponse: {
                                failedAt: new Date().toISOString(),
                                reason: 'Khalti server error during verification',
                                error: error.message,
                            },
                        },
                    });

                    // Clean up pending bookings
                    const bookingIds = pendingPayments.map(p => p.bookingId).filter(Boolean);
                    if (bookingIds.length > 0) {
                        await prisma.booking.deleteMany({
                            where: { id: { in: bookingIds }, status: 'pending' },
                        });
                    }

                    // Clean up pending event registrations
                    const registrationIds = pendingPayments.map(p => p.registrationId).filter(Boolean);
                    if (registrationIds.length > 0) {
                        await prisma.eventRegistration.deleteMany({
                            where: { id: { in: registrationIds }, paymentStatus: 'pending' },
                        });
                    }

                    return res.status(502).json({
                        success: false,
                        message: 'Payment verification failed due to a server error. Your booking has been cancelled. Please try booking again.',
                        data: { status: 'failed' },
                        error: error.response?.data?.detail || error.message,
                    });
                }
            }
        } catch (cleanupError) {
            console.error('Error during payment cleanup:', cleanupError);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.response?.data?.detail || error.message,
        });
    }
};

/**
 * Get Payment Status
 * GET /api/payments/:bookingId/status
 */
const getPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const payment = await prisma.payment.findFirst({
            where: {
                bookingId,
                userId,
            },
            select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
                transactionId: true,
                createdAt: true,
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        res.json({
            success: true,
            data: payment,
        });
    } catch (error) {
        console.error('Error fetching payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment status',
        });
    }
};

/**
 * Retry Payment for an existing pending Venue Booking
 * POST /api/payments/khalti/retry-booking
 * 
 * Called when user has a pending booking and wants to pay for it.
 * Does NOT create a new booking — just a new Khalti payment session.
 */
const retryBookingPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingIds, amount, returnUrl } = req.body;

        if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one booking ID is required' });
        }

        // Verify bookings still exist, are pending, and belong to this user
        const bookings = await prisma.booking.findMany({
            where: { id: { in: bookingIds }, userId, status: 'pending' },
            include: {
                slot: { include: { venue: { select: { id: true, name: true } } } },
            },
        });

        if (bookings.length !== bookingIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more bookings are no longer pending or do not belong to you. The slot may have been released.',
            });
        }

        // Expire any old pending/failed payment records for these bookings
        await prisma.payment.updateMany({
            where: { bookingId: { in: bookingIds }, status: { in: ['pending', 'failed'] } },
            data: { status: 'failed', gatewayResponse: { reason: 'Superseded by retry', expiredAt: new Date().toISOString() } },
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, phone: true },
        });

        const purchaseOrderId = `BMG-RETRY-${Date.now()}-${userId.slice(-6)}`;
        const purchaseOrderName = `Retry: Booking at ${bookings[0].slot.venue.name}`;

        const khaltiPayload = {
            return_url: returnUrl || `${config.frontendUrl}/payment/callback`,
            website_url: config.frontendUrl,
            amount: Math.round(amount * 100),
            purchase_order_id: purchaseOrderId,
            purchase_order_name: purchaseOrderName,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: user.phone || '9800000000',
            },
        };

        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiPayload,
            { headers: { 'Authorization': `Key ${config.khalti.secretKey}`, 'Content-Type': 'application/json' } }
        );

        if (!khaltiResponse.data || !khaltiResponse.data.payment_url) {
            throw new Error('Invalid response from Khalti');
        }

        // Create fresh payment records
        await prisma.payment.createMany({
            data: bookings.map(booking => ({
                bookingId: booking.id,
                userId,
                amount: parseFloat(booking.totalPrice),
                paymentMethod: 'khalti',
                transactionId: khaltiResponse.data.pidx,
                status: 'pending',
                gatewayResponse: {
                    pidx: khaltiResponse.data.pidx,
                    purchaseOrderId,
                    initiatedAt: new Date().toISOString(),
                    isRetry: true,
                },
            })),
        });

        res.json({
            success: true,
            message: 'Retry payment initiated',
            data: {
                paymentUrl: khaltiResponse.data.payment_url,
                pidx: khaltiResponse.data.pidx,
                purchaseOrderId,
                expiresAt: khaltiResponse.data.expires_at,
            },
        });
    } catch (error) {
        console.error('Error retrying booking payment:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate retry payment',
            error: error.response?.data?.detail || error.message,
        });
    }
};

/**
 * Retry Payment for an existing pending Event Registration
 * POST /api/payments/khalti/retry-event
 */
const retryEventPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { registrationId, amount, returnUrl } = req.body;

        if (!registrationId) {
            return res.status(400).json({ success: false, message: 'Registration ID is required' });
        }

        const registration = await prisma.eventRegistration.findFirst({
            where: { id: registrationId, userId, paymentStatus: 'pending' },
            include: {
                event: { select: { id: true, title: true, registrationFee: true } },
            },
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found, already paid, or the slot was released. Please register again.',
            });
        }

        // Expire old payment records
        await prisma.payment.updateMany({
            where: { registrationId, status: { in: ['pending', 'failed'] } },
            data: { status: 'failed', gatewayResponse: { reason: 'Superseded by retry', expiredAt: new Date().toISOString() } },
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, phone: true },
        });

        const purchaseOrderId = `EVT-RETRY-${Date.now()}-${userId.slice(-6)}`;
        const purchaseOrderName = `Retry: ${registration.event.title}`;

        const khaltiPayload = {
            return_url: returnUrl || `${config.frontendUrl}/payment/callback?type=event`,
            website_url: config.frontendUrl,
            amount: Math.round(amount * 100),
            purchase_order_id: purchaseOrderId,
            purchase_order_name: purchaseOrderName,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: user.phone || '9800000000',
            },
        };

        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiPayload,
            { headers: { 'Authorization': `Key ${config.khalti.secretKey}`, 'Content-Type': 'application/json' } }
        );

        if (!khaltiResponse.data || !khaltiResponse.data.payment_url) {
            throw new Error('Invalid response from Khalti');
        }

        await prisma.payment.create({
            data: {
                registrationId,
                userId,
                amount: parseFloat(amount),
                paymentMethod: 'khalti',
                transactionId: khaltiResponse.data.pidx,
                status: 'pending',
                gatewayResponse: {
                    pidx: khaltiResponse.data.pidx,
                    purchaseOrderId,
                    initiatedAt: new Date().toISOString(),
                    isRetry: true,
                },
            },
        });

        res.json({
            success: true,
            message: 'Retry event payment initiated',
            data: {
                paymentUrl: khaltiResponse.data.payment_url,
                pidx: khaltiResponse.data.pidx,
                purchaseOrderId,
                expiresAt: khaltiResponse.data.expires_at,
            },
        });
    } catch (error) {
        console.error('Error retrying event payment:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate retry event payment',
            error: error.response?.data?.detail || error.message,
        });
    }
};

module.exports = {
    initiateKhaltiPayment,
    initiateEventPayment,
    verifyKhaltiPayment,
    getPaymentStatus,
    retryBookingPayment,
    retryEventPayment,
};
