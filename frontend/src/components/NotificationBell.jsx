import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount: ctxUnread, fetchNotifications, markAsRead, clearNotifications } = useNotifications();
    const navigate = useNavigate();
    const bellRef = useRef(null);

    const unreadCount = ctxUnread !== undefined ? ctxUnread : notifications.filter(n => !n.read).length;

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState && fetchNotifications) {
            fetchNotifications();
        }
    };

    const getNotificationIcon = (type) => {
        const variants = {
            critical: 'badge-danger',
            warning: 'badge-warning',
            info: 'badge-info',
            success: 'badge-success'
        };
        return variants[type] || variants.info;
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        setIsOpen(false);
        navigate(`/notifications?id=${notification.id}`);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={bellRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={handleToggle}
                className={`relative p-2.5 rounded-xl hover:bg-bg-hover transition-colors cursor-pointer select-none ${isOpen ? 'bg-bg-hover text-primary' : 'text-text-secondary'}`}
                title="Notifications"
                aria-expanded={isOpen}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-danger text-text-primary text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-bg-dark shadow-lg shadow-danger/20">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Instant & Stable */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 bg-bg-card border border-border-color rounded-2xl shadow-2xl z-50 overflow-hidden"
                    style={{ transform: 'none' }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border-color flex items-center justify-between bg-white/5">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <Bell size={16} className="text-accent" />
                            Notifications
                        </h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {unreadCount} New
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-text-muted">
                                <Bell size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Clear system log</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    type="button"
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 border-b border-border-color hover:bg-bg-hover transition-colors text-left group cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-2 h-2 rounded-full mt-2.5 flex-shrink-0 transition-colors ${!notification.read ? 'bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-text-muted/20'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h4 className={`text-sm font-bold truncate transition-colors ${!notification.read ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[10px] text-text-muted font-bold whitespace-nowrap mt-0.5">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-secondary line-clamp-2 mb-3 leading-relaxed font-medium">
                                                {notification.message}
                                            </p>
                                            <span className={`badge ${getNotificationIcon(notification.type)}`}>
                                                {notification.type}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 bg-white/5 border-t border-border-color flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                                className="flex-1 py-2 text-xs text-text-primary hover:text-accent font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                View All
                            </button>
                            <button
                                type="button"
                                onClick={clearNotifications}
                                className="flex-1 py-2 text-xs text-text-muted hover:text-danger font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Dismiss All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
