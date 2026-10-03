import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Bell, Shield, Globe, Users, Check, X, Trash2 } from 'lucide-react';
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
                                    <div className="flex justify-between items-center border-b border-border-color pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-text-primary">Staff & User Permissions</h2>
                                        <div className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg uppercase tracking-widest border border-primary/20">Super Admin Config</div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-text-muted text-sm font-medium">Configure operational permissions and action overrides for users in the system.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            {users && users.filter(u => u.role !== 'Super Admin' && u.id !== user?.id).map((targetUser) => {
                                                const userPerms = targetUser.permissions ? (typeof targetUser.permissions === 'string' ? JSON.parse(targetUser.permissions) : targetUser.permissions) : {};
                                                return (
                                                    <div key={targetUser.id} className="p-4 rounded-xl border border-border-color bg-bg-hover/30">
                                                        <div className="flex justify-between items-center mb-4 border-b border-border-color pb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm">{getInitials(targetUser.name)}</div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-text-primary">{targetUser.name}</div>
                                                                    <div className="text-[10px] uppercase font-bold text-text-muted">{targetUser.email}</div>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">{targetUser.role || 'User'}</span>
                                                                        {targetUser.position && (
                                                                            <span className="text-[9px] font-medium text-text-muted truncate max-w-[140px]">{targetUser.position}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4 pt-1">
                                                            {[
                                                                { key: 'canAddAsset', label: 'Add New Asset' },
                                                                { key: 'canEditAsset', label: 'Edit Assets' },
                                                                { key: 'canArchiveAsset', label: 'Archive Assets' },
                                                                { key: 'canRestoreAsset', label: 'Restore Assets' },
                                                                { key: 'canTransferAssets', label: 'Transfer Assets' },
                                                                { key: 'canViewHistory', label: 'View History' },
                                                                { key: 'canViewDetails', label: 'View Details' }
                                                            ].map(perm => (
                                                                <div key={perm.key} className="flex justify-between items-center group">
                                                                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">{perm.label}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newPerms = { ...userPerms, [perm.key]: userPerms[perm.key] === true ? false : true };
                                                                            updateUser(targetUser.id, { permissions: JSON.stringify(newPerms) });
                                                                            addToast(`Permission updated for ${targetUser.name}`, 'success');
                                                                        }}
                                                                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${userPerms[perm.key] === true ? 'bg-primary' : 'bg-text-muted/20'}`}
                                                                    >
                                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${userPerms[perm.key] === true ? 'right-0.5' : 'left-0.5'}`}></div>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {users && users.filter(u => u.role !== 'Super Admin' && u.id !== user?.id).length === 0 && (
                                                <div className="col-span-1 md:col-span-2 text-center py-10 text-text-muted italic border border-dashed border-border-color rounded-xl bg-bg-hover/10">
                                                    No other users found in the system.
                                                </div>
                                            )}
                                        </div>
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
                            onCropComplete={async (croppedFile) => {
                                try {
                                    const { uploadProfileImage } = await import('../services/api');
                                    const res = await uploadProfileImage(croppedFile);
                                    if (res.success && res.data) {
                                        // Add timestamp to bust cache
                                        const pathWithTimestamp = `${res.data.profile_image.split('?')[0]}?t=${new Date().getTime()}`;
                                        const newUrl = getFullImageUrl(pathWithTimestamp);
                                        setAvatarUrl(newUrl);
                                        if (updateProfile) {
                                            updateProfile({ ...user, profile_image: pathWithTimestamp });
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
