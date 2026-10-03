<?php

/**
 * Notification Controller
 */

class NotificationController
{
    private $notificationModel;

    public function __construct($notificationModel)
    {
        $this->notificationModel = $notificationModel;
    }

    /**
     * Get user notifications
     */
    public function getMyNotifications()
    {
        if (!Request::isGet()) {
            Response::error('Method not allowed', 405);
        }

        $user = Middleware::requireAuth();

        $notifications = $this->notificationModel->getUserNotifications($user['id']);
        $unreadCount = $this->notificationModel->getUnreadCount($user['id']);

        Response::success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ], 'Notifications retrieved successfully');
    }

    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        if (!Request::isPut()) {
            Response::error('Method not allowed', 405);
        }

        $user = Middleware::requireAuth();
        $data = Request::getJSON();

        if (empty($data['id']) && empty($data['mark_all'])) {
            Response::error('Notification ID or mark_all flag required', 400);
        }

        if (!empty($data['mark_all'])) {
            $this->notificationModel->markAllAsRead($user['id']);
            Response::success(null, 'All notifications marked as read');
        } else {
            $this->notificationModel->markAsRead($data['id'], $user['id']);
            Response::success(null, 'Notification marked as read');
        }
    }
    /**
     * Delete all notifications
     */
    public function deleteAll()
    {
        if (!Request::isDelete()) {
            Response::error('Method not allowed', 405);
        }

        $user = Middleware::requireAuth();
        $this->notificationModel->deleteAll($user['id']);
        Response::success(null, 'All notifications deleted');
    }
}
