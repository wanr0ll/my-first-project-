import React, { createContext, useContext, useState, useEffect } from 'react';
import * as API from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setNotifications([]);
            return;
        }

        try {
            const response = await API.getNotifications();
            if (response.success && response.data && response.data.notifications) {
                const mapped = response.data.notifications.map(n => ({
                    ...n,
                    read: n.is_read == 1 || n.is_read === true,
                    timestamp: n.created_at
                }));
                // Only update state if data actually changed to avoid re-renders (simplified here)
                setNotifications(mapped);
            }
        } catch (error) {
            console.error("Failed fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        // Handle login/logout events dynamically if token changes
        const handleStorage = () => fetchNotifications();
        window.addEventListener('storage', handleStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const addNotification = () => {
        // Overrides local mock to rapidly fetch from server right after a successful action
        fetchNotifications();
    };

    const markAsRead = async (id) => {
        try {
            await API.markNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.markAllNotificationsAsRead();
            // Mark all current notifications as read instead of clearing them
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    };

    const clearNotifications = async () => {
        try {
            await API.clearAllNotifications();
            setNotifications([]);
        } catch (error) {
            console.error("Error clearing notifications", error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
