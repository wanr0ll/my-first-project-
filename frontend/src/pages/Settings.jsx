import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Bell, Shield, Globe, Users, Check, X, Trash2, CheckCircle2, PlusCircle, Edit3, ArrowRightLeft, Archive, RotateCcw, CalendarClock, History, Eye, Search, CheckCheck } from 'lucide-react';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_LIST } from '../context/ThemeContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { validatePassword } from '../utils/passwordUtils';
import { useNavigate } from 'react-router-dom';
import { sendPasswordChangeNotification } from '../services/emailService';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';
import * as API from '../services/api';
import { getFullImageUrl } from '../services/api';
import ImageCropper from '../components/ImageCropper';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user, users, updateUser, updateUserStatus, deleteUser, updateProfile } = useAuth();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Security States
    const [permissionsSearch, setPermissionsSearch] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(true);
    const [notificationsState, setNotificationsState] = useState({
        critical: true,
        weekly: true,
        maintenance: false,
        updates: true
    });
    const [avatarUrl, setAvatarUrl] = useState(getFullImageUrl(user?.profile_image) || user?.photo || null);
    const [profileFormData, setProfileFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        position: user?.position || ''
    });

    // Update form when user data loads
    React.useEffect(() => {
        if (user) {
            setProfileFormData({
                name: user.name || '',
                email: user.email || '',
                position: user.position || ''
            });
            setAvatarUrl(getFullImageUrl(user.profile_image) || user.photo || null);
        }
    }, [user]);

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        ...(user?.role === 'Super Admin' ? [{ id: 'permissions', label: 'Permissions', icon: Users }] : [])
    ];

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    };

    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (passwordData.new !== passwordData.confirm) {
            addToast('Passwords do not match!', 'error');
            return;
        }

        // Validate password strength
        const validation = validatePassword(passwordData.new);
        if (!validation.isValid) {
            addToast(`Password is too weak: ${validation.failedRequirements.join(', ')}`, 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await API.changePassword(passwordData.current, passwordData.new);
            if (response.success) {
                sendPasswordChangeNotification(user.email, user.name);
                addToast('Password changed successfully!', 'success');
                setIsPasswordModalOpen(false);
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                addToast(response.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            addToast(error.message || 'Failed to change password. Check your current password and try again.', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateUser(user.id, {
                name: profileFormData.name,
                position: profileFormData.position
            });
            addToast('Profile updated successfully!', 'success');
        } catch (error) {
            addToast(error.message || 'Failed to update profile', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-10 max-w-4xl mx-auto"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary text-glow mb-2">Settings</h1>
                    <p className="text-text-muted font-medium">Manage your account and system preferences for Asset Management System.</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="p-2.5 rounded-xl bg-bg-card border border-border-color text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                >
                    <X size={18} /> Close
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/5'
                                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary border border-transparent'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 glass-panel rounded-xl p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4 mb-6">General Settings</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">System Name</label>
                                            <input type="text" defaultValue="GHA Asset Management Portal" className="input-field" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Timezone</label>
                                            <select className="input-field cursor-pointer font-medium">
                                                <option>Greenwich Mean Time (GMT)</option>
                                                <option>Eastern Standard Time (EST)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4 mb-6">User Profile</h2>

                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-20 h-20 rounded-full border-4 border-white/5 shadow-2xl overflow-hidden bg-primary/20 flex items-center justify-center relative">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <span className="text-2xl font-bold text-primary flex items-center justify-center w-full h-full" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                                                {getInitials(user?.name)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-lg font-bold text-text-primary">{user?.name || 'User Name'}</h3>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent uppercase tracking-wider">
                                                    {user?.role || 'Admin'}
                                                </span>
                                            </div>
                                            <p className="text-text-muted font-medium">{user?.email || 'user@email.com'}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsAvatarModalOpen(true)}
                                            className="ml-auto text-xs font-bold text-accent hover:text-text-primary uppercase tracking-widest transition-colors"
                                        >
                                            Change Photo
                                        </button>
                                    </div>

                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={profileFormData.name}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                                    className="input-field"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={profileFormData.email}
                                                    disabled
                                                    className="input-field opacity-60 cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Position</label>
                                                <input
                                                    type="text"
                                                    value={profileFormData.position}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, position: e.target.value })}
                                                    placeholder="Enter your professional position"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                <Save size={18} /> Update Profile
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4 mb-2">Appearance</h2>
                                        <p className="text-sm text-text-muted mb-6">Customize how the GHA Asset Manager looks on your device.</p>
                                    </div>

                                    {/* Theme Selection */}
                                    <div>
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Theme Mode</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { id: 'navy', label: 'GHA Navy', icon: Monitor, gradient: 'from-[#1a2b4b] via-[#253d6b] to-[#1a2b4b]', desc: 'Professional government blue' },
                                                { id: 'light', label: 'Clean Light', icon: Sun, gradient: 'from-white via-[#f0f5ff] to-white', desc: 'Bright & crisp' },
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-3 group overflow-hidden ${theme === t.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border-color hover:border-text-muted/30 hover:shadow-md'}`}
                                                >
                                                    <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${t.gradient} border border-white/10 shadow-inner flex items-center justify-center relative`}>
                                                        <t.icon size={24} className={theme === t.id ? 'text-primary drop-shadow-lg' : t.id === 'light' ? 'text-slate-400' : 'text-white/40'} />
                                                        {theme === t.id && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className={`text-sm font-bold block ${theme === t.id ? 'text-primary' : 'text-text-primary'}`}>{t.label}</span>
                                                        <span className="text-[10px] text-text-muted font-medium">{t.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Accent Color Selection */}
                                    <div>
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-2">Accent Color</h3>
                                        <p className="text-xs text-text-muted mb-4">Personalize your experience with a custom accent color.</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                            {ACCENT_LIST.map((ac) => (
                                                <button
                                                    key={ac.id}
                                                    onClick={() => setAccentColor(ac.id)}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all group ${accentColor === ac.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border-color hover:border-text-muted/30 hover:shadow-sm'}`}
                                                >
                                                    <div className="relative">
                                                        <div
                                                            className="w-10 h-10 rounded-full shadow-md transition-transform group-hover:scale-110"
                                                            style={{ background: `linear-gradient(135deg, ${ac.colors[0]}, ${ac.colors[1]})` }}
                                                        />
                                                        {accentColor === ac.id && (
                                                            <div className="absolute inset-0 rounded-full border-2 border-white/80 flex items-center justify-center">
                                                                <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor === ac.id ? 'text-primary' : 'text-text-muted'}`}>{ac.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Live Preview */}
                                    <div className="p-4 rounded-xl border border-border-color bg-bg-hover/30">
                                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Live Preview</h4>
                                        <div className="flex flex-wrap gap-3">
                                            <button className="btn-primary text-xs py-2 px-4">Primary Button</button>
                                            <div className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-bold">Badge</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-primary" />
                                                <div className="w-3 h-3 rounded-full bg-primary/60" />
                                                <div className="w-3 h-3 rounded-full bg-primary/30" />
                                            </div>
                                            <div className="h-2 w-24 rounded-full bg-bg-hover overflow-hidden">
                                                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary-light" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-text-primary border-b border-border-color pb-4 mb-6">Notification Preferences</h2>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'critical', label: 'Email Alerts for Critical Failures' },
                                            { id: 'weekly', label: 'Weekly Report Summaries' },
                                            { id: 'maintenance', label: 'Maintenance Reminders' },
                                            { id: 'updates', label: 'System Updates' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-hover/50 border border-border-color">
                                                <span className="text-sm font-medium text-text-primary">{item.label}</span>
                                                <button
                                                    onClick={() => setNotificationsState(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notificationsState[item.id] ? 'bg-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-text-muted/20'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notificationsState[item.id] ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-text-primary border-b border-border-color pb-4 mb-6">Security Settings</h2>

                                    <button
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className="w-full text-left p-4 rounded-xl border border-border-color hover:bg-bg-hover transition-all group mb-3"
                                    >
                                        <div className="font-bold text-text-primary group-hover:text-accent transition-colors">Change Account Password</div>
                                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Last security update: 3 months ago</div>
                                    </button>
                                    <div
                                        className="w-full flex items-center justify-between p-4 rounded-xl border border-border-color bg-bg-hover/50"
                                    >
                                        <div>
                                            <div className="font-bold text-text-primary">Two-Factor Authentication</div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest mt-1">
                                                {is2FAEnabled ? <span className="text-success">System Securely Encrypted</span> : <span className="text-danger">Action Required</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIs2FAEnabled(!is2FAEnabled);
                                                addToast(`2FA has been ${!is2FAEnabled ? 'enabled' : 'disabled'}`, !is2FAEnabled ? 'success' : 'info');
                                            }}
                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${is2FAEnabled ? 'bg-primary' : 'bg-text-muted/20'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${is2FAEnabled ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-color pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-bold text-text-primary">Staff & Operational Permissions</h2>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                                    Super Admin
                                                </span>
                                            </div>
                                            <p className="text-text-muted text-xs font-medium mt-1">Configure operational authority and custom privilege overrides per user account.</p>
                                        </div>
                                        {/* Search Filter */}
                                        <div className="relative w-full sm:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                                            <input
                                                type="text"
                                                placeholder="Filter staff by name or role..."
                                                value={permissionsSearch}
                                                onChange={(e) => setPermissionsSearch(e.target.value)}
                                                className="w-full bg-bg-card border border-border-color rounded-xl py-2 pl-9 pr-8 text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                            />
                                            {permissionsSearch && (
                                                <button
                                                    onClick={() => setPermissionsSearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Staff Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                                        {users && users
                                            .filter(u => u.role !== 'Super Admin' && u.id !== user?.id)
                                            .filter(u => {
                                                if (!permissionsSearch.trim()) return true;
                                                const q = permissionsSearch.toLowerCase();
                                                return (u.name || '').toLowerCase().includes(q) ||
                                                    (u.email || '').toLowerCase().includes(q) ||
                                                    (u.role || '').toLowerCase().includes(q) ||
                                                    (u.position || '').toLowerCase().includes(q);
                                            })
                                            .map((targetUser) => {
                                                const userPerms = targetUser.permissions
                                                    ? (typeof targetUser.permissions === 'string' ? JSON.parse(targetUser.permissions) : targetUser.permissions)
                                                    : {};

                                                const PERMISSION_CONFIGS = [
                                                    {
                                                        key: 'canApproveAsset',
                                                        label: 'Approve Assets',
                                                        desc: 'Authorize & approve pending asset additions & modifications',
                                                        icon: CheckCircle2,
                                                        isApproval: true,
                                                        badge: 'Approval Authority'
                                                    },
                                                    {
                                                        key: 'canAddAsset',
                                                        label: 'Add New Asset',
                                                        desc: 'Register and submit new assets to inventory',
                                                        icon: PlusCircle
                                                    },
                                                    {
                                                        key: 'canEditAsset',
                                                        label: 'Edit Assets',
                                                        desc: 'Modify asset specifications, values and conditions',
                                                        icon: Edit3
                                                    },
                                                    {
                                                        key: 'canTransferAssets',
                                                        label: 'Transfer Assets',
                                                        desc: 'Reassign custody and transfer assets across divisions',
                                                        icon: ArrowRightLeft
                                                    },
                                                    {
                                                        key: 'canArchiveAsset',
                                                        label: 'Archive Assets',
                                                        desc: 'Archive aging assets or designate for disposal review',
                                                        icon: Archive
                                                    },
                                                    {
                                                        key: 'canRestoreAsset',
                                                        label: 'Restore Assets',
                                                        desc: 'Reactivate previously archived or disposed assets',
                                                        icon: RotateCcw
                                                    },
                                                    {
                                                        key: 'canScheduleMaintenance',
                                                        label: 'Schedule Maintenance',
                                                        desc: 'Schedule maintenance, inspections & work requests',
                                                        icon: CalendarClock
                                                    },
                                                    {
                                                        key: 'canViewHistory',
                                                        label: 'View History',
                                                        desc: 'Inspect asset audit trail & change activity logs',
                                                        icon: History
                                                    },
                                                    {
                                                        key: 'canViewDetails',
                                                        label: 'View Details',
                                                        desc: 'Access full asset valuation records and specifications',
                                                        icon: Eye
                                                    }
                                                ];

                                                const activeCount = PERMISSION_CONFIGS.filter(p => userPerms[p.key] === true).length;

                                                const togglePerm = async (permKey) => {
                                                    const nextState = userPerms[permKey] === true ? false : true;
                                                    const updated = { ...userPerms, [permKey]: nextState };
                                                    await updateUser(targetUser.id, { permissions: JSON.stringify(updated) }, { silent: true });
                                                };

                                                const setAll = async (value) => {
                                                    const updated = {};
                                                    PERMISSION_CONFIGS.forEach(p => { updated[p.key] = value; });
                                                    await updateUser(targetUser.id, { permissions: JSON.stringify(updated) }, { silent: true });
                                                };

                                                return (
                                                    <div
                                                        key={targetUser.id}
                                                        className="glass-panel rounded-2xl border border-border-color bg-bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                                    >
                                                        {/* Top Accent Gradient Bar */}
                                                        <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-emerald-500 w-full" />

                                                        <div className="p-5">
                                                            {/* User Header */}
                                                            <div className="flex items-start justify-between gap-3 pb-4 mb-3 border-b border-border-color/80">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="relative flex-shrink-0">
                                                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm overflow-hidden">
                                                                            {targetUser.profile_image ? (
                                                                                <img
                                                                                    src={getFullImageUrl(targetUser.profile_image)}
                                                                                    alt={targetUser.name}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                />
                                                                            ) : (
                                                                                getInitials(targetUser.name)
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-card ${
                                                                                targetUser.status === 'active' ? 'bg-success' : 'bg-warning'
                                                                            }`}
                                                                            title={targetUser.status === 'active' ? 'Active Account' : 'Pending Account'}
                                                                        />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h3 className="text-sm font-bold text-text-primary truncate">{targetUser.name}</h3>
                                                                        <p className="text-[11px] text-text-muted truncate font-medium">{targetUser.email}</p>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
                                                                                {targetUser.role || 'Staff'}
                                                                            </span>
                                                                            {targetUser.position && (
                                                                                <span className="text-[9px] font-medium text-text-secondary truncate max-w-[150px] px-1.5 py-0.5 rounded bg-bg-hover">
                                                                                    {targetUser.position}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Batch Controls */}
                                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                        {activeCount} of {PERMISSION_CONFIGS.length} Active
                                                                    </span>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setAll(true)}
                                                                            className="text-[10px] font-bold text-primary hover:text-primary-light transition-colors px-1"
                                                                            title="Enable all permissions"
                                                                        >
                                                                            All On
                                                                        </button>
                                                                        <span className="text-text-muted text-[10px]">·</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setAll(false)}
                                                                            className="text-[10px] font-bold text-text-muted hover:text-danger transition-colors px-1"
                                                                            title="Disable all permissions"
                                                                        >
                                                                            All Off
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Permissions Toggle List */}
                                                            <div className="space-y-1.5 pt-1">
                                                                {PERMISSION_CONFIGS.map(perm => {
                                                                    const Icon = perm.icon;
                                                                    const isAllowed = userPerms[perm.key] === true;

                                                                    return (
                                                                        <div
                                                                            key={perm.key}
                                                                            onClick={() => togglePerm(perm.key)}
                                                                            className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                                                                                perm.isApproval
                                                                                    ? isAllowed
                                                                                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                                                                                        : 'bg-bg-hover/40 border border-border-color hover:border-emerald-500/30'
                                                                                    : isAllowed
                                                                                        ? 'bg-primary/5 border border-primary/20'
                                                                                        : 'bg-transparent hover:bg-bg-hover/50 border border-transparent'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                                    perm.isApproval
                                                                                        ? isAllowed
                                                                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                                                                            : 'bg-emerald-500/10 text-emerald-500'
                                                                                        : isAllowed
                                                                                            ? 'bg-primary/20 text-primary'
                                                                                            : 'bg-bg-hover text-text-muted group-hover:text-text-secondary'
                                                                                }`}>
                                                                                    <Icon size={15} strokeWidth={2.5} />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                                        <span className="text-xs font-bold text-text-primary leading-tight">
                                                                                            {perm.label}
                                                                                        </span>
                                                                                        {perm.isApproval && (
                                                                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 tracking-wider">
                                                                                                Approve
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-[10px] text-text-muted font-medium truncate mt-0.5">
                                                                                        {perm.desc}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Modern Switch Toggle */}
                                                                            <div className="flex items-center flex-shrink-0">
                                                                                <button
                                                                                    type="button"
                                                                                    role="switch"
                                                                                    aria-checked={isAllowed}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        togglePerm(perm.key);
                                                                                    }}
                                                                                    className={`w-11 h-6 rounded-full relative transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                                                                        isAllowed
                                                                                            ? perm.isApproval
                                                                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/40'
                                                                                                : 'bg-gradient-to-r from-primary to-primary-light shadow-sm shadow-primary/30'
                                                                                            : 'bg-slate-300 dark:bg-zinc-700'
                                                                                    }`}
                                                                                >
                                                                                    <div
                                                                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                                                                                            isAllowed ? 'translate-x-6' : 'translate-x-1'
                                                                                        }`}
                                                                                    >
                                                                                        {isAllowed && (
                                                                                            <Check size={9} strokeWidth={3} className={perm.isApproval ? 'text-emerald-600' : 'text-primary'} />
                                                                                        )}
                                                                                    </div>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {users && users.filter(u => u.role !== 'Super Admin' && u.id !== user?.id).length === 0 && (
                                            <div className="col-span-1 md:col-span-2 text-center py-12 text-text-muted italic border border-dashed border-border-color rounded-2xl bg-bg-hover/10">
                                                No other staff users registered in the system.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Avatar Upload Modal */}
            <Modal isOpen={isAvatarModalOpen} onClose={() => {
                setIsAvatarModalOpen(false);
                setSelectedImageForCrop(null);
            }} title="Change Profile Picture">
                <div className="space-y-4">
                    {selectedImageForCrop ? (
                        <ImageCropper 
                            imageSrc={selectedImageForCrop}
                            onCancel={() => setSelectedImageForCrop(null)}
                            onCropComplete={async (base64DataUrl) => {
                                try {
                                    const { uploadProfileImage } = await import('../services/api');
                                    const res = await uploadProfileImage(base64DataUrl);
                                    if (res.success && res.data) {
                                        // profile_image is now a base64 data URL — use directly
                                        const newUrl = res.data.profile_image;
                                        setAvatarUrl(newUrl);
                                        if (updateProfile) {
                                            updateProfile({ ...user, profile_image: newUrl });
                                        }
                                        addToast('Profile picture updated successfully!', 'success');
                                        setIsAvatarModalOpen(false);
                                        setSelectedImageForCrop(null);
                                    }
                                } catch (error) {
                                    addToast(error.message || 'Upload failed', 'error');
                                }
                            }}

                        />
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden bg-primary/20 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <span className="text-4xl font-bold text-primary flex items-center justify-center w-full h-full" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                                    {getInitials(user?.name)}
                                </span>
                            </div>
                            <div className="text-center">
                                <label className="cursor-pointer inline-flex items-center gap-3 px-6 py-2.5 bg-primary text-text-primary rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg active:scale-95">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        if (e.target.files[0]) {
                                            const fileUrl = URL.createObjectURL(e.target.files[0]);
                                            setSelectedImageForCrop(fileUrl);
                                        }
                                    }} />
                                    Choose Image
                                </label>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-4 opacity-50">Crop to fit 800x800px</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Change Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Current Password</label>
                        <input
                            required
                            type="password"
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                            className="input-field"
                            placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">New Password</label>
                        <input
                            required
                            type="password"
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            className="input-field"
                            placeholder="Enter new password"
                        />
                        {/* Password Strength Indicator */}
                        <div className="mt-3">
                            <PasswordStrengthIndicator password={passwordData.new} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Confirm New Password</label>
                        <input
                            required
                            type="password"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            className="input-field"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-border-color">
                        <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save size={18} /> Update Password
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default Settings;
