const notificationModel = require('../models/notificationModel');
const { success, error } = require('../utils/response');

class NotificationController {
    /**
     * Get logged-in user notifications
     */
    async getMyNotifications(req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;

        const notifications = await notificationModel.getUserNotifications(userId, limit);
        const unreadCount = await notificationModel.getUnreadCount(userId);

        return success(res, {
            notifications,
            unread_count: unreadCount
        }, 'Notifications retrieved successfully');
    }

    /**
     * Mark notification(s) as read
     */
    async markAsRead(req, res) {
        const userId = req.user.id;
        const { id, mark_all } = req.body || {};

        if (!id && !mark_all) {
            return error(res, 'Notification ID or mark_all flag required', 400);
        }

        if (mark_all) {
            await notificationModel.markAllAsRead(userId);
            return success(res, null, 'All notifications marked as read');
        } else {
            await notificationModel.markAsRead(id, userId);
            return success(res, null, 'Notification marked as read');
        }
    }

    /**
     * Delete all notifications for user
     */
    async deleteAll(req, res) {
        const userId = req.user.id;
        await notificationModel.deleteAll(userId);
        return success(res, null, 'All notifications deleted');
    }
}

module.exports = new NotificationController();
