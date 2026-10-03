import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import StatsOverview from '../components/StatsOverview';
import { ArrowRight, Activity, Plus, FileText, Settings, Download, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { useMaintenanceTasks } from '../context/MaintenanceContext';
import WorkerDashboard from '../components/WorkerDashboard';
import AddAssetModal from '../components/AddAssetModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user, permissions } = useAuth();
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
            window.dispatchEvent(new Event('resize'));
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // If user is a Worker, show the specialized Worker Dashboard directly
    if (user && user.role === 'Worker') {
        return <WorkerDashboard user={user} />;
    }

    const { assets, activities } = useAssets();
    const { getActiveTasks } = useMaintenanceTasks();

    const allAssets = Array.isArray(assets) ? assets : [];
    const isInactive = (a) => ['archived', 'disposed', 'scrapped', 'sold'].includes((a.status || '').toLowerCase());
    const activeInventoryAssets = allAssets.filter(a => !isInactive(a));
    const approvedAssets = activeInventoryAssets.filter(a => a.approval_status === 'Approved');
    const totalAssets = approvedAssets.length;

    // The user requested to update the "Active Asset" icon to show only active assets (from any category)
    const activeAssetsCount = approvedAssets.filter(a => a.status === 'Active').length;

    // The user requested a Pending Asset count
    const pendingAssetsCount = activeInventoryAssets.filter(a => a.approval_status === 'Pending').length;

    // The user requested to update the "Maintenance Tasks" to show the number of assets under maintenance
    const underMaintenanceCount = approvedAssets.filter(a => a.status === 'Maintenance' || a.status === 'Under Maintenance').length;

    const healthyAssets = approvedAssets.filter(a => ['Active', 'Good', 'New', 'In Service', 'Completed'].includes(a.status)).length;
    const equipmentHealth = totalAssets > 0 ? Math.round((healthyAssets / totalAssets) * 100) : 0;

    const dashboardStats = {
        totalAssets,
        activeAssets: activeAssetsCount,
        maintenanceAssets: underMaintenanceCount,
        pendingAssets: pendingAssetsCount,
        equipmentHealth
    };

    const handleStatClick = (statType) => {
        // We'll handle this in the navigation to the asset list with specific filters
        if (statType === 'pendingAssets') {
            navigate('/assets', { state: { filter: 'Pending Approval' } });
        } else if (statType === 'maintenanceAssets') {
            navigate('/assets', { state: { filter: 'Maintenance' } });
        } else if (statType === 'activeAssets') {
            navigate('/assets', { state: { filter: 'Active' } });
        } else {
            navigate('/assets');
        }
    };

    const getMonthlyData = () => {
        const months = [
            { name: 'Jan', month: 0, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Feb', month: 1, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Mar', month: 2, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Apr', month: 3, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'May', month: 4, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Jun', month: 5, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Jul', month: 6, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Aug', month: 7, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Sep', month: 8, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Oct', month: 9, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Nov', month: 10, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 },
            { name: 'Dec', month: 11, fixedMoveable: 0, fixedNonMoveable: 0, nonFixed: 0 }
        ];

        const currentYear = new Date().getFullYear();

        activeInventoryAssets.forEach(asset => {
            const assetDate = asset.created_at ? new Date(asset.created_at.replace(' ', 'T')) : new Date();
            if (assetDate.getFullYear() === currentYear) {
                const m = months[assetDate.getMonth()];
                if (asset.major_category === 'Fixed Asset') {
                    if (asset.asset_type === 'Moveable') m.fixedMoveable++;
                    else m.fixedNonMoveable++;
                } else {
                    m.nonFixed++;
                }
            }
        });

        return months;
    };

    const monthlyData = getMonthlyData();

    const ChartCard = ({ title, data, dataKey, color }) => (
        <div className="glass-panel p-6 rounded-2xl flex-1 min-w-0 w-full">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">{title}</h3>
            <div className="h-[200px] w-full min-w-0">
                {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-color)" opacity={0.3} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-color)', borderRadius: '12px', fontSize: '11px' }}
                            />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 min-w-0 w-full"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                        Dashboard Overview
                    </h1>
                    <p className="text-text-muted mt-1 font-medium">Ghana Highway Authority | Asset Management System</p>
                </div>
                {permissions.canAddAsset(user) && (
                    <button onClick={() => setIsAddAssetModalOpen(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 w-full md:w-auto justify-center">
                        <Plus size={18} /> Add New Asset
                    </button>
                )}
            </div>

            <StatsOverview stats={dashboardStats} onStatClick={handleStatClick} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full min-w-0">
                <ChartCard title="Fixed Moveable Assets" data={monthlyData} dataKey="fixedMoveable" color="var(--color-primary)" />
                <ChartCard title="Fixed Non-Moveable Assets" data={monthlyData} dataKey="fixedNonMoveable" color="var(--color-accent)" />
                <ChartCard title="Non-Fixed Assets" data={monthlyData} dataKey="nonFixed" color="#94a3b8" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
                <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
                    <div className="glass-panel p-6 rounded-2xl min-w-0 w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-text-primary">Asset Performance Trends</h3>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div> Fixed Moveable
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                    <div className="w-2 h-2 rounded-full bg-accent"></div> Fixed Non-Moveable
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div> Non-Fixed
                                </span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-color)" opacity={0.2} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-card)',
                                                border: '1px solid var(--color-border-color)',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="fixedMoveable"
                                            stroke="var(--color-primary)"
                                            fillOpacity={1}
                                            fill="url(#colorActive)"
                                            strokeWidth={3}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="fixedNonMoveable"
                                            stroke="var(--color-accent)"
                                            fillOpacity={0}
                                            strokeWidth={3}
                                            strokeDasharray="5 5"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="nonFixed"
                                            stroke="#94a3b8"
                                            fillOpacity={0}
                                            strokeWidth={3}
                                            strokeDasharray="3 3"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl h-[300px] flex flex-col">
                        <div className="card-header mb-4">
                            <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
                        </div>
                        <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            {activities && activities.length > 0 ? (
                                activities.map((activity, idx) => (
                                    <div key={idx} className="p-3 border-b border-border-color last:border-0 hover:bg-bg-hover/50 transition-colors flex gap-3 group rounded-xl">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shadow-[0_0_8px_rgba(34,197,94,0.3)] flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm text-text-primary font-medium group-hover:text-primary transition-colors">{activity.action}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{activity.description}</p>
                                            <p className="text-[10px] text-text-muted/60 mt-1 font-mono uppercase">
                                                {new Date(activity.performed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-text-muted italic px-2">No recent activity found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddAssetModal
                isOpen={isAddAssetModalOpen}
                onClose={() => setIsAddAssetModalOpen(false)}
            />
        </motion.div >
    );
};

export default Dashboard;
