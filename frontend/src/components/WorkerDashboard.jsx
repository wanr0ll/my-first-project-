import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Clipboard, Clock, AlertTriangle, ArrowRight, User, Truck, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import { useMaintenanceTasks } from '../context/MaintenanceContext';

import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { getFullImageUrl } from '../services/api';

const WorkerDashboard = ({ user }) => {
    const { assets } = useAssets();
    const { getActiveTasks, addMaintenanceTask } = useMaintenanceTasks();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const avatarUrl = getFullImageUrl(user?.profile_image) || user?.photo;

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    };

    // Aggregate all assets from Context
    const allAssets = Array.isArray(assets) ? assets : [];
    const isInactive = (a) => ['archived', 'disposed', 'scrapped', 'sold'].includes((a.status || '').toLowerCase());
    const activeInventoryAssets = allAssets.filter(a => !isInactive(a));
    const approvedAssets = activeInventoryAssets.filter(a => a.approval_status === 'Approved');

    // Calculate global stats (matching Admin Dashboard)
    const totalAssets = approvedAssets.length;
    const activeAssets = approvedAssets.filter(v => v.status === 'Active').length;
    const pendingAssetsCount = activeInventoryAssets.filter(a => a.approval_status === 'Pending').length;
    const maintenanceCount = getActiveTasks().length;

    // Calculate global asset health (percentage of assets in Good/Active condition)
    const healthyAssets = approvedAssets.filter(a => ['Active', 'Good', 'New', 'In Service', 'Completed'].includes(a.status)).length;
    const equipmentHealth = totalAssets > 0 ? Math.round((healthyAssets / totalAssets) * 100) : 0;

    const stats = [
        { label: 'Total Assets', value: totalAssets, icon: Package, color: 'text-primary', filter: 'Approved' },
        { label: 'Asset Health', value: `${equipmentHealth}%`, icon: AlertTriangle, color: 'text-success', filter: 'health' },
        { label: 'Maintenance Task', value: maintenanceCount, icon: Clock, color: 'text-warning', filter: 'Maintenance' },
        { label: 'Active Assets', value: activeAssets, icon: Truck, color: 'text-blue-500', filter: 'Active' },
        { label: 'Pending Asset', value: pendingAssetsCount, icon: Clock, color: 'text-orange-500', filter: 'Pending Approval' },
    ];

    const handleStatClick = (stat) => {
        if (stat.label === 'Maintenance Task') {
            navigate('/maintenance');
        } else if (stat.filter) {
            navigate('/assets', { state: { filter: stat.filter } });
        } else {
            navigate('/assets');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-[1200px] mx-auto space-y-8"
        >
            {/* Header */}
            <div className="flex items-center gap-4 bg-bg-card p-6 rounded-2xl border border-border-color shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner relative z-10 overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <span className="text-xl font-bold flex items-center justify-center w-full h-full" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                        {getInitials(user?.name)}
                    </span>
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-text-primary">Welcome, {user.name}</h1>
                    <p className="text-text-muted mt-1">Here is an overview of the GHA assets and tasks.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => handleStatClick(stat)}
                            className="glass-panel p-6 rounded-xl flex items-center justify-between hover:shadow-lg hover:border-primary/30 transition-all border border-border-color group cursor-pointer"
                        >
                            <div>
                                <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full bg-bg-hover ${stat.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Clipboard size={20} className="text-primary" /> Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => navigate('/assets')}
                            className="p-4 rounded-xl glass-panel hover:bg-bg-hover transition-all text-left group border border-border-color flex items-center gap-4"
                        >
                            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Package size={20} />
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold text-text-primary block group-hover:text-primary transition-colors">View All Assets</span>
                                <span className="text-xs text-text-muted mt-1 block">Browse the complete GHA asset inventory and details.</span>
                            </div>
                            <ArrowRight size={18} className="text-text-muted group-hover:translate-x-1 group-hover:text-primary transition-all" />
                        </button>
                    </div>
                </div>

                {/* Recent Maintenance Summary */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Clock size={20} className="text-warning" /> Active Tasks
                    </h2>
                    <div className="glass-panel rounded-xl overflow-hidden border border-border-color">
                        {getActiveTasks().slice(0, 4).map((task, idx) => (
                            <div key={idx} className="p-4 border-b border-border-color last:border-0 hover:bg-bg-hover/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-bg-dark flex items-center justify-center text-text-muted group-hover:text-warning transition-colors">
                                        <Wrench size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary text-sm">{task.asset_name}</p>
                                        <p className="text-[10px] text-text-muted uppercase font-bold">{task.description?.substring(0, 30)}...</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-current ${task.status === 'Overdue' ? 'text-danger' : 'text-warning'}`}>
                                    {task.status}
                                </span>
                            </div>
                        ))}
                        {getActiveTasks().length === 0 && (
                            <div className="p-10 text-center text-text-muted italic text-sm">No active maintenance tasks.</div>
                        )}
                        {getActiveTasks().length > 0 && (
                            <button onClick={() => navigate('/maintenance')} className="w-full p-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors uppercase tracking-widest border-t border-border-color">
                                View Full Schedule
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WorkerDashboard;
