const { query } = require('../config/db');

class NotificationModel {
    /**
     * Create a notification for specific users
     */
    async create(userIds, title, message, type = 'info', relatedAssetId = null) {
        if (!Array.isArray(userIds) || userIds.length === 0) return true;

        const sql = `
            INSERT INTO notifications (user_id, title, message, type, related_asset_id) 
            VALUES ($1, $2, $3, $4, $5);
        `;

        let successCount = 0;
        for (const uid of userIds) {
            try {
                await query(sql, [uid, title, message, type, relatedAssetId]);
                successCount++;
            } catch (err) {
                console.error(`Notification failed for user ${uid}:`, err.message);
            }
        }

        return successCount > 0;
    }

    /**
     * Notify all super admins
     */
    async notifyAdmins(title, message, type = 'info', relatedAssetId = null) {
        try {
            const res = await query("SELECT id FROM users WHERE role = 'Super Admin';");
            const adminIds = res.rows.map(r => r.id);
            if (adminIds.length === 0) return true;
            return await this.create(adminIds, title, message, type, relatedAssetId);
        } catch (err) {
            console.error('notifyAdmins error:', err.message);
            return false;
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, limit = 50) {
        const sql = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2;
        `;
        const res = await query(sql, [userId, parseInt(limit, 10) || 50]);
        return res.rows;
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        const sql = `
            SELECT COUNT(*)::int as count 
            FROM notifications 
            WHERE user_id = $1 AND is_read = FALSE;
        `;
        const res = await query(sql, [userId]);
        return res.rows[0]?.count || 0;
    }

    /**
     * Mark single notification as read
     */
    async markAsRead(notificationId, userId) {
        const sql = 'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2;';
        const res = await query(sql, [notificationId, userId]);
        return res.rowCount > 0;
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const sql = 'UPDATE notifications SET is_read = TRUE WHERE user_id = $1;';
        const res = await query(sql, [userId]);
        return res.rowCount > 0;
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAll(userId) {
        const sql = 'DELETE FROM notifications WHERE user_id = $1;';
        const res = await query(sql, [userId]);
        return res.rowCount > 0;
    }
}

module.exports = new NotificationModel();
