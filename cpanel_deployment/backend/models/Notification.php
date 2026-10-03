<?php

/**
 * Notification Model - Handles database operations for notifications
 */

class Notification
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Create a notification for specific users
     */
    public function create($userIds, $title, $message, $type = 'info', $relatedAssetId = null)
    {
        $query = "INSERT INTO notifications (user_id, title, message, type, related_asset_id) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);

        $successCount = 0;
        foreach ($userIds as $userId) {
            $stmt->bind_param('ssssi', $userId, $title, $message, $type, $relatedAssetId);
            if ($stmt->execute()) {
                $successCount++;
            }
        }

        return $successCount > 0;
    }

    /**
     * Create notification for all admins and super admins
     */
    public function notifyAdmins($title, $message, $type = 'info', $relatedAssetId = null)
    {
        // Fetch all Admins and Super Admins
        $query = "SELECT id FROM users WHERE role IN ('Administrator', 'Super Admin')";
        $result = $this->db->query($query);

        $userIds = [];
        while ($row = $result->fetch_assoc()) {
            $userIds[] = $row['id'];
        }

        if (empty($userIds)) return true; // No admins to notify

        return $this->create($userIds, $title, $message, $type, $relatedAssetId);
    }

    /**
     * Get user notifications
     */
    public function getUserNotifications($userId, $limit = 50)
    {
        $query = "SELECT * FROM notifications 
                  WHERE user_id = ? 
                  ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('si', $userId, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
        }

        return $notifications;
    }

    /**
     * Get unread notification count
     */
    public function getUnreadCount($userId)
    {
        $query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ? (int)$result['count'] : 0;
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId)
    {
        $query = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('is', $notificationId, $userId);
        return $stmt->execute();
    }

    /**
     * Mark all as read
     */
    public function markAllAsRead($userId)
    {
        $query = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $userId);
        return $stmt->execute();
    }
    /**
     * Delete all notifications
     */
    public function deleteAll($userId)
    {
        $query = "DELETE FROM notifications WHERE user_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $userId);
        return $stmt->execute();
    }
}
