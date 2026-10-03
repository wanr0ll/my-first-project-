import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, Trash2, Search, Filter, Shield, User, Mail, MoreVertical, Edit2, Save, Clock, Plus, Send, Package, Phone, Calendar, Hash, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useAssets } from '../context/AssetContext';
import { getFullImageUrl } from '../services/api';

const UserManagement = () => {
    const { users, user: currentUser, updateUserStatus, updateUser, deleteUser, signup, loadUsers, permissions, resendVerification } = useAuth();
    const { assets } = useAssets();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Initial load
    React.useEffect(() => {
        loadUsers();
    }, []);

    // Asset View State
    const [selectedUserForAssets, setSelectedUserForAssets] = useState(null);
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', position: '', password: '', phone: '' });

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'Administrator', position: '' });

    const USER_POSITIONS = [
        'Chief Executive',
        'Deputy Chief Executive(Admin)',
        'Deputy Chief Executive(Dev)',
        'Deputy Chief Executive(Mtce)',
        'Director of MIS',
        'Director of Legal Service',
        'Director of HR',
        'Director of Finance',
        'Director of Public Affairs',
        'Director of Training',
        'Director of Audit',
        'Director of Contracts',
        'Director of Survey & Design',
        'Director of Materials',
        'Director of Bridges',
        'Director of Planning',
        'Director of Safety & Environment',
        'Director of Quantity Surveying',
        'Director of Road Maintenance',
        'Plant & Equipment'
    ];

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || roleFilter === 'All Roles' || !roleFilter ? true : (u.role && u.role.toLowerCase().includes(roleFilter.toLowerCase()));
        const matchesStatus = statusFilter === 'All' ? true :
            statusFilter === 'pending' ? (u.status === 'pending' || u.status === 'suspended') :
                u.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (!permissions.canManageUsers(currentUser)) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 text-center">
                <Shield size={64} className="text-danger/50" />
                <h2 className="text-2xl font-bold text-text-primary">Access Restricted</h2>
                <p className="text-text-muted">Only Super Administrators have access to this page.</p>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Users',
            value: users.length,
            icon: Users,
            color: 'text-primary',
            filter: 'All',
            active: statusFilter === 'All'
        },
        {
            label: 'Suspended',
            value: users.filter(u => u.status === 'pending' || u.status === 'suspended').length,
            icon: Clock,
            color: 'text-warning',
            filter: 'pending',
            active: statusFilter === 'pending'
        },
        {
            label: 'Verified Accounts',
            value: users.filter(u => u.status === 'active').length,
            icon: Shield,
            color: 'text-success',
            filter: 'active',
            active: statusFilter === 'active'
        }
    ];

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position || '',
            password: '',
            phone: user.phone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = (e) => {
        e.preventDefault();
        updateUser(editingUser.id, editFormData);
        setIsEditModalOpen(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        // Validate email format client-side
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUserData.email)) {
            addToast('Please enter a valid email address.', 'error');
            return;
        }

        const result = await signup(
            newUserData.name,
            newUserData.email,
            newUserData.password,
            newUserData.role,
            'General',
            { position: newUserData.position }
        );
        if (result.success) {
            setIsCreateModalOpen(false);
            setNewUserData({ name: '', email: '', password: '', role: 'Administrator', position: '' });
            addToast(
                `Account created! A verification code has been sent to ${newUserData.email}.`,
                'success'
            );
        }
    };

    const handleResendVerification = async (user) => {
        await resendVerification(user.email);
    };

    if (!permissions.canManageUsers(currentUser)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 mt-20">
                <Shield size={64} className="text-danger mb-4 opacity-80" />
                <h1 className="text-2xl font-bold text-text-primary">Access Denied</h1>
                <p className="text-text-muted mt-2">Only Super Admins can access User Management.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-[1600px] mx-auto space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-text-muted mt-1 font-medium">Manage system access, verify accounts, and monitor user activity.</p>
                </div>
                <div className="flex gap-3">
                    {statusFilter !== 'All' && (
                        <button
                            onClick={() => setStatusFilter('All')}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        <Plus size={18} /> Add Admin
                    </button>
                </div>
            </div>

            {/* Quick Stats (Interactive) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <button
                        key={idx}
                        onClick={() => setStatusFilter(stat.filter)}
                        className={`glass-panel p-6 rounded-2xl flex items-center gap-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${stat.active ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:border-border-color'
                            }`}
                    >
                        <div className={`p-3 rounded-xl bg-bg-hover ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-card border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all font-medium"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by Role..."
                            value={roleFilter === 'All' || roleFilter === 'All Roles' ? '' : roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value || 'All')}
                            className="bg-bg-card border border-border-color rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold focus:border-primary outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-border-color">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-color bg-bg-hover/50">
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">User Details</th>
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Position</th>
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Assigned Assets</th>
                                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {filteredUsers.length > 0 ? filteredUsers.map(u => {
                                const assignedAssets = (assets || []).filter(a => a.custodian_id === u.id || a.custodian_name === u.name);
                                return (
                                    <tr key={u.id} className="hover:bg-bg-hover/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm overflow-hidden">
                                                        {u.profile_image ? (
                                                            <img
                                                                src={getFullImageUrl(u.profile_image)}
                                                                alt={u.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                            />
                                                        ) : null}
                                                        <span className="flex items-center justify-center w-full h-full" style={{ display: u.profile_image ? 'none' : 'flex' }}>
                                                            {u.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-card ${u.id === currentUser?.id || u.is_online == 1 ? 'bg-success' : 'bg-text-muted'
                                                            }`}
                                                        title={u.id === currentUser?.id || u.is_online == 1 ? 'Online' : 'Offline'}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-primary">{u.name}</p>
                                                    <p className="text-xs text-text-muted font-medium">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider w-fit ${
                                                u.role === 'Super Admin' ? 'bg-danger/10 text-danger border border-danger/20' :
                                                u.role === 'CEO' || u.role === 'Chief Executive' ? 'bg-primary/10 text-primary' :
                                                'bg-text-secondary/10 text-text-secondary'
                                                }`}>
                                                {u.role || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[11px] font-bold text-text-primary px-1">{u.position || '—'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${u.status === 'active' ? 'text-success' :
                                                    u.status === 'suspended' ? 'text-danger' :
                                                        'text-warning'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-success' :
                                                        u.status === 'suspended' ? 'bg-danger' :
                                                            'bg-warning animate-pulse'
                                                        }`} />
                                                    {u.status}
                                                </span>
                                                <span className={`text-[9px] font-bold opacity-60 uppercase tracking-widest ${u.email_verified ? 'text-success' : 'text-warning'
                                                    }`}>
                                                    {u.email_verified ? 'Email Verified' : 'Email Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-1 rounded-lg bg-bg-hover text-[11px] font-bold ${assignedAssets.length > 0 ? 'text-primary' : 'text-text-muted'}`}>
                                                    {assignedAssets.length} Assets
                                                </div>
                                                {assignedAssets.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserForAssets(u);
                                                            setIsAssetsModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-bold text-primary hover:underline"
                                                    >
                                                        VIEW
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Resend Verification Email */}
                                                {!u.email_verified && (
                                                    <button
                                                        onClick={() => handleResendVerification(u)}
                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                        title="Resend Verification Email"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEditClick(u)}
                                                    className="p-2 rounded-lg bg-text-secondary/10 text-text-secondary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                {u.id !== currentUser?.id && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Approve Button (for pending or suspended) */}
                                                        {(u.status === 'pending' || u.status === 'suspended') && (
                                                            <button
                                                                onClick={() => updateUserStatus(u.id, 'active')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success-dark transition-all shadow-md text-[10px] font-bold uppercase tracking-wider"
                                                                title="Approve / Activate User"
                                                            >
                                                                <Check size={14} strokeWidth={3} /> Approve
                                                            </button>
                                                        )}

                                                        {/* Suspend Button (for active or pending) */}
                                                        {(u.status === 'active' || u.status === 'pending') && (
                                                            <button
                                                                onClick={() => updateUserStatus(u.id, 'suspended')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all shadow-sm text-[10px] font-bold uppercase tracking-wider"
                                                                title="Suspend User"
                                                            >
                                                                <X size={14} strokeWidth={3} /> Suspend
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to delete ${u.name}? This action cannot be undone.`)) {
                                                                    deleteUser(u.id);
                                                                }
                                                            }}
                                                            className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all shadow-sm"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-muted font-medium">
                                        No users found matching your search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit User`}
            >
                {editingUser && (
                    <div className="space-y-5">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/30">
                                    {editingUser.name.charAt(0)}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-bg-card ${editingUser.status === 'active' ? 'bg-success' : editingUser.status === 'suspended' ? 'bg-danger' : 'bg-warning animate-pulse'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-text-primary truncate">{editingUser.name}</h3>
                                <p className="text-xs text-text-muted font-medium truncate">{editingUser.email}</p>
                            </div>
                        </div>

                        {/* Read-only Info Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-bg-hover/60 border border-border-color text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Hash size={12} className="text-text-muted" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">User ID</span>
                                </div>
                                <p className="text-xs font-bold text-primary truncate" title={editingUser.id}>{editingUser.id}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-bg-hover/60 border border-border-color text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Shield size={12} className="text-text-muted" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Status</span>
                                </div>
                                <span className={`text-xs font-bold uppercase ${editingUser.status === 'active' ? 'text-success' : editingUser.status === 'suspended' ? 'text-danger' : 'text-warning'}`}>
                                    {editingUser.status}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-bg-hover/60 border border-border-color text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Mail size={12} className="text-text-muted" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Email</span>
                                </div>
                                <span className={`text-xs font-bold uppercase ${editingUser.email_verified ? 'text-success' : 'text-warning'}`}>
                                    {editingUser.email_verified ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-bg-hover/60 border border-border-color text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Calendar size={12} className="text-text-muted" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Joined</span>
                                </div>
                                <p className="text-xs font-bold text-text-secondary">
                                    {editingUser.created_at ? new Date(editingUser.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Editable Form */}
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="tel"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="input-field pl-10"
                                        placeholder="e.g. +233 XX XXX XXXX"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Role</label>
                                    <input
                                        type="text"
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter role"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Position</label>
                                    <select
                                        value={editFormData.position}
                                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Select a position (Optional)</option>
                                        {USER_POSITIONS.map(pos => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Reset Password (Optional)</label>
                                    <input
                                        type="password"
                                        value={editFormData.password}
                                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter new password to reset"
                                    />
                                    <p className="text-[10px] text-text-muted mt-2 ml-1 uppercase tracking-widest font-bold">Leave blank to keep existing password.</p>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-border-color">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* Create New User Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New User Account"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    {/* How it works banner */}
                    <div className="p-4 rounded-xl bg-bg-hover/60 border border-border-color space-y-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">How User Onboarding Works</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { step: '1', icon: Mail, label: 'Verification email sent' },
                                { step: '2', icon: Shield, label: 'User logs in to verify email' },
                                { step: '3', icon: Key, label: 'User creates permanent password' },
                            ].map(({ step, icon: Icon, label }) => (
                                <div key={step} className="flex flex-col items-center text-center gap-2 p-2 rounded-lg bg-bg-dark/40">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{step}</div>
                                    <Icon size={14} className="text-text-muted" />
                                    <p className="text-[10px] text-text-muted leading-tight font-medium">{label}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-text-muted/70 text-center italic">Provide a temporary password for the user to log in initially.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={newUserData.name}
                            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                            className="input-field"
                            placeholder="Enter full name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Email Address <span className="text-danger">*</span></label>
                        <input
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                            className="input-field"
                            placeholder="user@gha.gov.gh"
                            required
                        />
                        <p className="text-[10px] text-warning mt-1 ml-1 font-semibold">⚠ Must be a valid email — the user will receive their activation code here.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Temporary Password <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            className="input-field"
                            placeholder="Set initial password"
                            required
                        />
                        <p className="text-[10px] text-text-muted mt-1 ml-1 font-semibold">Min 8 chars, including uppercase, lowercase, and numbers.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Role</label>
                            <input
                                type="text"
                                value={newUserData.role}
                                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                className="input-field"
                                placeholder="Enter role (e.g. Administrator, Worker, etc.)"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">Position</label>
                            <select
                                value={newUserData.position}
                                onChange={(e) => setNewUserData({ ...newUserData, position: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select a position (Optional)</option>
                                {USER_POSITIONS.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Security notice */}
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                        <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-text-muted leading-relaxed">
                            A verification email will be sent to the user. They will use this temporary password to verify their email, after which they must<span className="text-primary font-bold"> set their own private permanent password</span>.
                        </p>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-border-color">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={18} /> Create User
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Assigned Assets Modal */}
            <Modal
                isOpen={isAssetsModalOpen}
                onClose={() => setIsAssetsModalOpen(false)}
                title={`Assets Assigned to ${selectedUserForAssets?.name}`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {selectedUserForAssets && (assets || []).filter(a => a.custodian_id === selectedUserForAssets.id || a.custodian_name === selectedUserForAssets.name).length > 0 ? (
                        (assets || []).filter(a => a.custodian_id === selectedUserForAssets.id || a.custodian_name === selectedUserForAssets.name).map(asset => (
                            <div key={asset.id} className="p-4 rounded-xl bg-bg-hover/50 border border-border-color flex items-center gap-4 group hover:bg-bg-hover transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Package size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-text-primary group-hover:text-primary transition-colors">{asset.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{asset.id}</span>
                                        <span className="w-1 h-1 rounded-full bg-border-color" />
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{asset.category}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${asset.status === 'Active' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                                        {asset.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-text-muted font-medium italic">No assets assigned to this user.</p>
                    )}
                </div>
                <div className="pt-4 flex justify-end border-t border-border-color mt-4">
                    <button
                        onClick={() => setIsAssetsModalOpen(false)}
                        className="px-6 py-2 bg-text-secondary/10 text-text-secondary hover:bg-bg-hover rounded-xl text-sm font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default UserManagement;
