import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as API from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            setIsLoading(true);
            const response = await API.getNotifications();
            if (response && response.success) {
                // Support response.data as array OR response.data.notifications OR response.notifications
                const rawList = Array.isArray(response.data)
                    ? response.data
                    : (Array.isArray(response.data?.notifications)
                        ? response.data.notifications
                        : (Array.isArray(response.notifications) ? response.notifications : []));

                const mapped = rawList.map(n => ({
                    ...n,
                    read: n.is_read == 1 || n.is_read === true,
                    timestamp: n.created_at || n.timestamp || new Date().toISOString()
                }));

                setNotifications(mapped);
                setUnreadCount(mapped.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Failed fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch immediately when user logs in or profile updates
    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    // Polling and focus listener
    useEffect(() => {
        const interval = setInterval(() => {
            if (localStorage.getItem('auth_token')) {
                fetchNotifications();
            }
        }, 15000);

        const handleFocus = () => {
            if (localStorage.getItem('auth_token')) {
                fetchNotifications();
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleFocus);
        window.addEventListener('refresh_notifications', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleFocus);
            window.removeEventListener('refresh_notifications', handleFocus);
        };
    }, [fetchNotifications]);

    const addNotification = () => {
        fetchNotifications();
    };

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await API.markNotificationAsRead(id);
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
        setUnreadCount(0);

        try {
            await API.markAllNotificationsAsRead();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const clearNotifications = async () => {
        // Optimistic update
        setNotifications([]);
        setUnreadCount(0);

        try {
            await API.clearAllNotifications();
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
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
