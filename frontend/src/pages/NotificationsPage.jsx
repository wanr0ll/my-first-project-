import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const selectedId = searchParams.get('id');
    
    // Find the selected notification directly from the state
    // Coerce to string to safely match ID strings or numbers
    const selectedNotification = notifications.find(n => n.id.toString() === selectedId) || null;

    useEffect(() => {
        if (selectedNotification && !selectedNotification.read) {
            markAsRead(selectedNotification.id);
        }
    }, [selectedNotification, markAsRead]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-success" size={24} />;
            case 'warning': return <AlertTriangle className="text-warning" size={24} />;
            case 'critical': return <XCircle className="text-danger" size={24} />;
            default: return <Info className="text-info" size={24} />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 h-full min-h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-text-primary transition-all shadow-lg text-xs font-bold uppercase tracking-widest w-fit"
                >
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
            
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary text-glow">Notifications</h1>
                    <p className="text-text-muted mt-2 font-medium">View and manage your system alerts and messages.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={markAllAsRead} className="btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-widest">
                        Mark All Read
                    </button>
                    <button onClick={clearNotifications} className="btn-primary bg-danger hover:bg-danger/80 py-2 px-4 text-xs font-bold uppercase tracking-widest border-none shadow-danger/20">
                        Clear All
                    </button>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-[500px]">
                {/* Left side: List */}
                <div className="w-1/3 glass-panel rounded-xl overflow-hidden flex flex-col shadow-xl">
                    <div className="p-4 border-b border-white/5 bg-white/5 font-bold text-text-primary text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2"><Bell size={16} className="text-accent"/> Inbox</span>
                        <span className="text-xs text-text-muted font-medium">{notifications.filter(n => !n.read).length} unread</span>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-text-muted">
                                <Bell size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No notifications found.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id}
                                    onClick={() => setSearchParams({ id: n.id })}
                                    className={`p-4 border-b border-border-color cursor-pointer transition-all hover:bg-bg-hover ${selectedId === n.id.toString() ? 'bg-primary/10 border-l-4 border-l-primary' : ''} ${!n.read ? 'bg-white/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0 scale-75 origin-top-left">{getIcon(n.type)}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm truncate font-bold ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>{n.title}</h4>
                                                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
                                            </div>
                                            <p className="text-xs text-text-muted line-clamp-1">{n.message}</p>
                                            <p className="text-[10px] text-text-muted/60 mt-2 font-semibold">{formatTimestamp(n.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right side: Detail View */}
                <div className="flex-1 glass-panel rounded-xl overflow-hidden shadow-xl flex flex-col relative">
                    {selectedNotification ? (
                        <div className="p-8 flex flex-col h-full">
                            <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-6 shrink-0">
                                <div className="p-4 bg-white/5 rounded-2xl shrink-0 shadow-inner border border-white/5">
                                    {getIcon(selectedNotification.type)}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-text-primary mb-3">{selectedNotification.title}</h2>
                                    <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 bg-bg-dark/50 px-3 py-1.5 rounded-lg border border-white/5">
                                            {formatTimestamp(selectedNotification.timestamp)}
                                        </span>
                                        <span className={`badge badge-${selectedNotification.type === 'critical' ? 'danger' : selectedNotification.type} px-3 py-1.5 text-[10px]`}>
                                            {selectedNotification.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar text-text-secondary leading-relaxed text-sm whitespace-pre-wrap font-medium p-4 bg-bg-dark/30 rounded-xl border border-white/5 shadow-inner">
                                {selectedNotification.message}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-white/5 flex justify-end items-center shrink-0">
                                {selectedNotification.link && (
                                    <button 
                                        onClick={() => navigate(selectedNotification.link)}
                                        className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-primary/20"
                                    >
                                        View Related Item <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted/50 p-10">
                            <Bell size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-bold">Select a notification</p>
                            <p className="text-sm font-medium mt-1">Click on a message from the list to view its full details.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default NotificationsPage;
