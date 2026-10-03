import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, RefreshCw, ArrowRightLeft, Edit2, Plus, Trash2, CheckCircle, XCircle, LogIn, LogOut, Clock, ChevronDown, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssets } from '../context/AssetContext';
import { useToast } from '../components/Toast';
import * as API from '../services/api';

const ACTION_ICONS = {
    'Asset Created': { icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'Asset Updated': { icon: Edit2, color: 'text-primary', bg: 'bg-primary/10' },
    'Asset Status Changed': { icon: Edit2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    'Asset Approved': { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    'Asset Rejected': { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
    'Asset Deleted': { icon: Trash2, color: 'text-danger', bg: 'bg-danger/10' },
    'Asset Transferred': { icon: ArrowRightLeft, color: 'text-accent', bg: 'bg-accent/10' },
    'Asset Maintained': { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'Checked Out': { icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    'Checked In': { icon: LogIn, color: 'text-teal-500', bg: 'bg-teal-500/10' },
};

const getActionMeta = (action = '') => {
    for (const [key, val] of Object.entries(ACTION_ICONS)) {
        if (action.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return { icon: History, color: 'text-text-muted', bg: 'bg-bg-hover' };
};

const ACTION_TYPES = ['All Actions', 'Asset Created', 'Asset Updated', 'Asset Status Changed', 'Asset Approved', 'Asset Rejected', 'Asset Transferred', 'Asset Maintained', 'Asset Deleted'];

const AssetHistory = () => {
    const { assets } = useAssets();
    const { addToast } = useToast();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('All Actions');
    const [assetFilter, setAssetFilter] = useState('All Assets');
    const [expandedId, setExpandedId] = useState(null);

    const fetchAllHistory = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch history for each asset and flatten into one timeline
            const allAssets = assets || [];
            if (allAssets.length === 0) { setHistory([]); return; }

            const historyArrays = await Promise.all(
                allAssets.map(async (a) => {
                    try {
                        const resp = await API.getAssetHistory(a.id);
                        if (resp.success && Array.isArray(resp.data)) {
                            return resp.data.map(h => {
                                let changes = h.changes;
                                if (!changes && h.old_values && h.new_values) {
                                    try {
                                        const oldV = JSON.parse(h.old_values);
                                        const newV = JSON.parse(h.new_values);
                                        const diffs = [];
                                        for (const key in newV) {
                                            if (oldV[key] != newV[key] && !['updated_at', 'id', 'created_at', 'last_service_date'].includes(key) && key !== 'notes') {
                                                diffs.push(`${key}: ${oldV[key] || 'empty'} -> ${newV[key] || 'empty'}`);
                                            }
                                        }
                                        if (diffs.length > 0) {
                                            changes = diffs.join('\n');
                                        }
                                    } catch (e) { }
                                }
                                return { ...h, changes, assetName: a.name, assetId: a.id };
                            });
                        }
                        return [];
                    } catch { return []; }
                })
            );

            const flat = historyArrays.flat().sort((a, b) =>
                new Date(b.performed_at) - new Date(a.performed_at)
            );
            setHistory(flat);
        } catch (err) {
            addToast('Failed to load history', 'error');
        } finally {
            setLoading(false);
        }
    }, [assets, addToast]);

    useEffect(() => { fetchAllHistory(); }, [fetchAllHistory]);

    const uniqueAssetNames = ['All Assets', ...new Set((assets || []).map(a => a.name))];

    const filtered = history.filter(h => {
        const matchSearch = !searchTerm ||
            h.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.performed_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchAction = actionFilter === 'All Actions' ||
            h.action?.toLowerCase().includes(actionFilter.toLowerCase());

        const matchAsset = assetFilter === 'All Assets' || h.assetName === assetFilter;

        return matchSearch && matchAction && matchAsset;
    });

    // Group by date for timeline view
    const grouped = filtered.reduce((acc, item) => {
        const date = item.performed_at
            ? new Date(item.performed_at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Unknown Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    return (
        <div className="animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Asset History</h1>
                    <p className="text-text-secondary mt-1.5 text-sm">
                        Global audit trail of all asset events across the GHA system.
                    </p>
                </div>
                <button
                    onClick={fetchAllHistory}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border-color bg-bg-card/50 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Events', value: history.length, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Assets Tracked', value: new Set(history.map(h => h.assetId)).size, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Today\'s Events', value: history.filter(h => new Date(h.performed_at).toDateString() === new Date().toDateString()).length, color: 'text-accent', bg: 'bg-accent/10' },
                    { label: 'Pending Filtered', value: filtered.length, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map(stat => (
                    <div key={stat.label} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                            <History size={18} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search by asset, action, user..."
                        className="w-full pl-10 pr-4 py-2 bg-bg-dark border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-muted/60"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-text-muted" />
                    <select
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        className="bg-bg-card border border-border-color rounded-lg text-sm px-3 py-2 text-text-secondary focus:outline-none focus:border-primary/50"
                    >
                        {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={assetFilter}
                        onChange={e => setAssetFilter(e.target.value)}
                        className="bg-bg-card border border-border-color rounded-lg text-sm px-3 py-2 text-text-secondary focus:outline-none focus:border-primary/50 max-w-[200px]"
                    >
                        {uniqueAssetNames.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-8">
                {loading ? (
                    <div className="glass-panel rounded-xl p-16 text-center">
                        <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-text-muted font-medium">Loading asset history across all records...</p>
                    </div>
                ) : Object.keys(grouped).length === 0 ? (
                    <div className="glass-panel rounded-xl p-16 text-center border-2 border-dashed border-border-color">
                        <History size={40} className="text-text-muted/40 mx-auto mb-4" />
                        <p className="text-text-muted font-medium">No history records found.</p>
                        <p className="text-text-muted/60 text-sm mt-1">Try adjusting your filters or refreshing.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            {/* Date Divider */}
                            <div className="flex items-center gap-3 mb-4">
                                <Clock size={14} className="text-text-muted shrink-0" />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">{date}</span>
                                <div className="flex-1 h-px bg-border-color/50" />
                                <span className="text-[10px] font-bold text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">{items.length} event{items.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {items.map((item, idx) => {
                                        const meta = getActionMeta(item.action);
                                        const Icon = meta.icon;
                                        const isExpanded = expandedId === `${date}-${idx}`;

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="glass-panel rounded-xl overflow-hidden hover:border-primary/20 transition-colors cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : `${date}-${idx}`)}
                                            >
                                                <div className="flex items-start gap-4 p-4">
                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                        <Icon size={18} className={meta.color} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div>
                                                                <span className={`text-xs font-extrabold uppercase tracking-wider ${meta.color}`}>{item.action}</span>
                                                                <span className="text-text-muted mx-2 text-xs">•</span>
                                                                <span className="text-sm font-bold text-text-primary">{item.assetName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] text-text-muted font-medium tabular-nums">
                                                                    {item.performed_at ? new Date(item.performed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>
                                                                <ChevronDown size={14} className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-1">{item.description}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold uppercase">
                                                                {item.performed_by_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                                {item.performed_by_name || 'Unknown User'}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted/50 font-mono">{item.assetId}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Detail */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 pt-0 border-t border-border-color/50 bg-bg-hover/20">
                                                                <div className="pt-3 space-y-2">
                                                                    <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                                                                    {item.changes && (
                                                                        <div className="mt-3 p-3 bg-bg-dark rounded-lg border border-border-color/50">
                                                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Change Details</p>
                                                                            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">{typeof item.changes === 'string' ? item.changes : JSON.stringify(item.changes, null, 2)}</pre>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-3 pt-2">
                                                                        <span className="text-[10px] font-bold text-text-muted uppercase">Asset ID:</span>
                                                                        <span className="text-[10px] font-mono text-primary">{item.assetId}</span>
                                                                        <span className="text-[10px] font-bold text-text-muted uppercase ml-2">Full Timestamp:</span>
                                                                        <span className="text-[10px] font-mono text-text-secondary">{item.performed_at ? new Date(item.performed_at).toLocaleString() : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AssetHistory;
