import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFullImageUrl } from '../services/api';

const UserProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) {
            setConfirmLogout(false);
            return;
        }

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
                setConfirmLogout(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        setConfirmLogout(false);
        navigate('/login');
    };

    // Get initials from user name
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarUrl = getFullImageUrl(user?.profile_image) || user?.photo;

    return (
        <div className="relative" ref={menuRef}>
            {/* Profile Button */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-3 pl-2 py-1 pr-1 hover:bg-bg-hover rounded-xl cursor-pointer focus:outline-none select-none"
                aria-expanded={isOpen}
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-text-primary leading-tight">
                        {user?.name || 'User'}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        {user?.role || 'Staff'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-text-primary font-bold border-2 border-white/10 shadow-md overflow-hidden shrink-0">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={user?.name || 'Profile'}
                            loading="eager"
                            decoding="sync"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <span
                        className="flex items-center justify-center w-full h-full text-xs font-bold"
                        style={{ display: avatarUrl ? 'none' : 'flex' }}
                    >
                        {getInitials(user?.name)}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-text-muted ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>

            {/* Dropdown Panel - Instant & Completely Stable with Zero Blink */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 bg-bg-card border border-border-color rounded-2xl shadow-2xl z-50 overflow-hidden"
                    style={{ transform: 'none' }}
                >
                    {/* User Info */}
                    <div className="p-4 border-b border-border-color bg-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-bg-dark border border-border-color flex items-center justify-center text-text-primary font-bold text-base shadow-inner overflow-hidden shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={user?.name || 'Profile'}
                                        loading="eager"
                                        decoding="sync"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <span
                                    className="flex items-center justify-center w-full h-full"
                                    style={{ display: avatarUrl ? 'none' : 'flex' }}
                                >
                                    {getInitials(user?.name)}
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
                    <div className="p-2">
                        {confirmLogout ? (
                            <div className="p-2 space-y-2 bg-danger/5 rounded-xl border border-danger/20">
                                <p className="text-xs font-semibold text-text-primary text-center">
                                    Are you sure you want to logout?
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-danger text-white rounded-lg text-xs font-bold hover:bg-danger/90 cursor-pointer shadow-sm"
                                    >
                                        <Check size={14} /> Yes, Logout
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmLogout(false)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-bg-hover text-text-secondary rounded-lg text-xs font-medium hover:text-text-primary cursor-pointer"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmLogout(true)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/10 text-left group cursor-pointer"
                            >
                                <div className="p-1.5 rounded-lg bg-danger/5 group-hover:bg-danger/20">
                                    <LogOut size={16} className="text-text-muted group-hover:text-danger" />
                                </div>
                                <span className="text-sm font-bold text-text-secondary group-hover:text-danger">
                                    Logout
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileMenu;
