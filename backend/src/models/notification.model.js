const prisma = require('../config/prisma');

/**
 * Notification Model - Prisma Query Helpers
 * Encapsulates common notification-related database operations
 */

/**
 * Create a new notification
 */
const createNotification = async (data) => {
    return prisma.notification.create({
        data,
    });
};

/**
 * Create notifications for multiple users
 */
const createBulk = async (notifications) => {
    return prisma.notification.createMany({
        data: notifications,
    });
};

/**
 * Find notifications for a user with pagination
 */
const findByUser = async (userId, { isRead, page = 1, limit = 20 } = {}) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        userId,
        ...(isRead !== undefined && { isRead }),
    };

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.notification.count({ where }),
    ]);

    return { notifications, total, pages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Find unread notifications for a user
 */
const findUnread = async (userId) => {
    return prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Count unread notifications for a user
 */
const countUnread = async (userId) => {
    return prisma.notification.count({
        where: { userId, isRead: false },
    });
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (id) => {
    return prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
};

/**
 * Delete notification by ID
 */
const deleteNotification = async (id) => {
    return prisma.notification.delete({
        where: { id },
    });
};

module.exports = {
    createNotification,
    createBulk,
    findByUser,
    findUnread,
    countUnread,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
