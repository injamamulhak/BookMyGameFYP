const prisma = require('../config/prisma');
const { createNotification } = require('../models/notification.model');

/**
 * Review Reply Controller
 * Handles creating and deleting replies to reviews
 */

// POST /api/reviews/:reviewId/replies
const createReply = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Comment is required' });
        }

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { venue: true }
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Optional permission check: allow only the original reviewer or venue operator to reply
        if (review.userId !== userId && review.venue.operatorId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only the reviewer or venue operator can reply to this review' });
        }

        const reply = await prisma.reviewReply.create({
            data: {
                reviewId,
                userId,
                comment: comment.trim(),
            },
            include: {
                user: {
                    select: { id: true, fullName: true, role: true, profileImage: true }
                }
            }
        });

        // Notifications
        if (userId === review.venue.operatorId && review.userId !== userId) {
            // Operator replied to user's review -> Notify User
            await createNotification({
                userId: review.userId,
                type: 'review_reply',
                title: 'Operator Replied',
                message: `The operator of ${review.venue.name} replied to your review.`,
                relatedEntityType: 'venue',
                relatedEntityId: review.venueId,
                link: `/venues/${review.venueId}`,
            });
        } else if (userId === review.userId && review.venue.operatorId && review.venue.operatorId !== userId) {
            // User replied -> Notify Operator
            await createNotification({
                userId: review.venue.operatorId,
                type: 'review_reply',
                title: 'User Replied to Review',
                message: `A user added a reply to a review on "${review.venue.name}".`,
                relatedEntityType: 'venue',
                relatedEntityId: review.venueId,
                link: '/operator/reviews',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Reply added successfully',
            data: reply,
        });
    } catch (error) {
        console.error('Create review reply error:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
    }
};

// DELETE /api/reviews/replies/:id
const deleteReply = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const reply = await prisma.reviewReply.findUnique({
            where: { id },
            include: { review: { include: { venue: true } } }
        });

        if (!reply) {
            return res.status(404).json({ success: false, message: 'Reply not found' });
        }

        // Only reply author or venue operator or admin can delete
        const isAuthor = reply.userId === userId;
        const isOperator = reply.review.venue.operatorId === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isOperator && !isAdmin) {
            return res.status(403).json({ success: false, message: 'No permission to delete reply' });
        }

        await prisma.reviewReply.delete({ where: { id } });

        res.json({ success: true, message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Delete review reply error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete reply' });
    }
};

module.exports = {
    createReply,
    deleteReply,
};
