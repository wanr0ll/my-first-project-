import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as API from '../services/api';
import { getFullImageUrl } from '../services/api';

const UserProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (!window.confirm('Are you sure you want to logout?')) return;
        logout();
        setIsOpen(false);
        navigate('/login');
    };

    const handleSettings = () => {
        setIsOpen(false);
        navigate('/settings');
    };

    // Get initials from user name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarUrl = getFullImageUrl(user?.profile_image) || user?.photo;

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('theme-dark'));

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('theme-dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('theme-dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <div className="relative">
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 hover:bg-bg-hover rounded-lg transition-all group"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                        {user?.name || 'User'}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        {user?.role || 'Staff'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-text-primary font-bold border-2 border-white/10 shadow-lg group-hover:border-primary transition-all group-hover:scale-105 overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <span className="flex items-center justify-center w-full h-full" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                        {getInitials(user?.name || 'U')}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute right-0 mt-3 w-64 bg-bg-card glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* User Info */}
                            <div className="p-5 border-b border-white/5 bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-text-primary font-bold text-xl shadow-inner overflow-hidden">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        ) : null}
                                        <span className="flex items-center justify-center w-full h-full" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                                            {getInitials(user?.name || 'U')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate">
                                            {user?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-text-muted font-medium truncate">
                                            {user?.email || 'user@gha.gov.gh'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2 space-y-1">

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/10 transition-all text-left group"
                                >
                                    <div className="p-1.5 rounded-lg bg-danger/5 group-hover:bg-danger/20 transition-colors">
                                        <LogOut size={16} className="text-text-muted group-hover:text-danger transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-text-secondary group-hover:text-danger transition-colors">
                                        Logout
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfileMenu;
