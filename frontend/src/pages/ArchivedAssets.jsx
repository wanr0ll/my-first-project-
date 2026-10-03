import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Archive,
    Search,
    Shield,
    Eye,
    RefreshCw,
    X,
    Filter,
    Calendar,
    Package,
    Tag,
    Banknote,
    Clock,
    ChevronDown,
    RotateCcw,
    AlertTriangle,
    CheckCircle2,
    SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { useToast } from '../components/Toast';
import { getDefaultImage } from '../utils/assetImages';
import Modal from '../components/Modal';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div className={`glass-panel p-5 rounded-2xl border border-border-color flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={22} />
        </div>
        <div className="flex flex-col justify-center min-w-0">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest whitespace-nowrap truncate">{label}</p>
            <p className="text-2xl font-bold text-text-primary leading-tight mt-0.5">{value}</p>
            {subtext && <p className="text-[11px] text-text-muted mt-0.5 whitespace-nowrap truncate">{subtext}</p>}
        </div>
    </div>
);

// ─── Restore Confirm Modal ────────────────────────────────────────────────────
const RestoreModal = ({ isOpen, asset, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isOpen) { setReason(''); setError(''); }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!reason.trim()) { setError('A restore reason is required.'); return; }
        onConfirm(reason.trim());
    };

    if (!isOpen || !asset) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-bg-card border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden"
            >
                <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <RotateCcw size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-base">Restore Asset</h3>
                        <p className="text-xs text-text-muted mt-0.5">This will move the asset back to active inventory.</p>
                    </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">
                            Reason for Restoration <span className="text-emerald-400">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setError(''); }}
                            placeholder="e.g. Asset was archived by mistake, re-commissioned for active use..."
                            rows={4}
                            className={`w-full bg-bg-dark border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none transition-colors ${error ? 'border-danger/60' : 'border-border-color focus:border-emerald-500/50'}`}
                        />
                        {error && (
                            <p className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> {error}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border border-border-color bg-bg-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <RotateCcw size={14} />
                            )}
                            Confirm Restore
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Detail View Modal ────────────────────────────────────────────────────────
const DetailRow = ({ label, value, highlight }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5 border-b border-border-color/50 last:border-0">
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex-shrink-0">{label}</span>
        <span className={`text-sm font-bold text-right ${highlight || 'text-text-primary'}`}>{value || '—'}</span>
    </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ArchivedAssets = () => {
    const { user, permissions } = useAuth();
    const { assets, updateAsset, loadAssets } = useAssets();
    const { addToast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Modals
    const [detailAsset, setDetailAsset] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);

    // Guard: Super Admin only
    if (!permissions.canManageUsers(user)) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-2">
                    <Shield size={40} className="text-danger/60" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Access Restricted</h2>
                <p className="text-text-muted max-w-sm">Only Super Administrators have access to the Archived Assets page.</p>
            </div>
        );
    }

    // ── Data ──────────────────────────────────────────────────────────────────
    const allAssets = Array.isArray(assets) ? assets : [];
    const archivedAssets = allAssets.filter(a => a.status === 'Archived');

    const categories = useMemo(() => {
        const cats = [...new Set(archivedAssets.map(a => a.category).filter(Boolean))];
        return ['All', ...cats.sort()];
    }, [archivedAssets]);

    const filteredAssets = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return archivedAssets.filter(asset => {
            const matchesSearch = !term || (
                (asset.name && asset.name.toLowerCase().includes(term)) ||
                (asset.id && asset.id.toLowerCase().includes(term)) ||
                (asset.asset_id && asset.asset_id.toLowerCase().includes(term)) ||
                (asset.serial_number && asset.serial_number.toLowerCase().includes(term)) ||
                (asset.custodian_name && asset.custodian_name.toLowerCase().includes(term))
            );
            const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [archivedAssets, searchTerm, categoryFilter]);

    // Helper functions for book value and archive reason
    const getBookValue = (asset) => {
        if (!asset) return 0;
        const val = asset.book_value ?? asset.current_value ?? asset.purchase_cost ?? asset.cost ?? asset.purchase_price ?? asset.price ?? asset.value;
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    const getArchiveReason = (asset) => {
        if (!asset) return '—';
        return asset.archive_reason || asset.archived_reason || asset.reason || asset.disposal_reason || asset.notes || '—';
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalValue = archivedAssets.reduce((sum, a) => sum + getBookValue(a), 0);
    const filteredTotalBookValue = useMemo(() => {
        return filteredAssets.reduce((sum, a) => sum + getBookValue(a), 0);
    }, [filteredAssets]);
    const categoryCount = new Set(archivedAssets.map(a => a.category).filter(Boolean)).size;
    const recentCount = archivedAssets.filter(a => {
        const d = new Date(a.updated_at || a.created_at);
        const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
    }).length;

    // ── Selection helpers ─────────────────────────────────────────────────────
    const isAllSelected = filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length;
    const isIndeterminate = selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length;

    const handleSelectAll = (e) => setSelectedAssets(e.target.checked ? filteredAssets.map(a => a.id) : []);
    const handleSelectAsset = (id) => setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const clearSelection = () => setSelectedAssets([]);

    // ── Restore ───────────────────────────────────────────────────────────────
    const handleRestoreClick = (asset) => { setRestoreTarget(asset); setIsRestoreOpen(true); };

    const handleRestoreConfirm = async (reason) => {
        if (!restoreTarget) return;
        setActionLoading(true);
        const result = await updateAsset(
            { ...restoreTarget, status: 'Active', restore_reason: reason },
            { silent: false }
        );
        setActionLoading(false);
        setIsRestoreOpen(false);
        setRestoreTarget(null);
        if (result.success) {
            addToast(`"${restoreTarget.name}" restored to active inventory.`, 'success');
            clearSelection();
        }
    };

    // ── Bulk Restore ──────────────────────────────────────────────────────────
    const handleBulkRestoreClick = () => {
        if (selectedAssets.length === 0) return;
        // Open restore modal pointing at a pseudo-asset with all selected IDs
        setRestoreTarget({ id: '__bulk__', name: `${selectedAssets.length} selected assets` });
        setIsRestoreOpen(true);
    };

    const handleRestoreConfirmFull = async (reason) => {
        if (restoreTarget?.id === '__bulk__') {
            setActionLoading(true);
            const targets = allAssets.filter(a => selectedAssets.includes(a.id));
            let ok = 0, fail = 0;
            for (const asset of targets) {
                const res = await updateAsset({ ...asset, status: 'Active', restore_reason: reason }, { silent: true, skipRefresh: true });
                res.success ? ok++ : fail++;
            }
            await loadAssets();
            setActionLoading(false);
            setIsRestoreOpen(false);
            setRestoreTarget(null);
            clearSelection();
            if (ok > 0) addToast(`${ok} asset(s) restored to inventory.`, 'success');
            if (fail > 0) addToast(`${fail} asset(s) failed to restore.`, 'error');
        } else {
            await handleRestoreConfirm(reason);
        }
    };



    const formatCurrency = (val) => {
        const n = parseFloat(val);
        if (isNaN(n) || n === 0) return '—';
        return `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 pb-10"
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <Archive size={20} className="text-amber-400" />
                        </div>
                        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            Archived Assets
                        </h1>
                    </div>
                    <p className="text-text-muted font-medium ml-13">
                        Long-term archive of assets removed from active circulation. Super Admin access only.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} /> Super Admin
                    </span>
                </div>
            </div>

            {/* ── Stats ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Archive}
                    label="Total Archived"
                    value={archivedAssets.length}
                    color="bg-amber-500/15 text-amber-400"
                />
                <StatCard
                    icon={Tag}
                    label="Categories"
                    value={categoryCount}
                    color="bg-primary/15 text-primary"
                />
                <StatCard
                    icon={Banknote}
                    label="Total Book Value"
                    value={totalValue > 0 ? `₵${(totalValue / 1000).toFixed(1)}k` : '—'}
                    color="bg-success/15 text-success"
                    subtext={totalValue > 0 ? `Est. at time of archiving` : undefined}
                />
                <StatCard
                    icon={Clock}
                    label="Archived (Last 30d)"
                    value={recentCount}
                    color="bg-accent/15 text-accent"
                />
            </div>

            {/* ── Main Panel ─────────────────────────────────────────────────── */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">

                {/* Toolbar */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px] max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={17} />
                        <input
                            type="text"
                            placeholder="Search archived assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-dark border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 text-text-primary transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border-color text-text-muted hover:border-primary/30 hover:text-primary'}`}
                        >
                            <SlidersHorizontal size={15} />
                            Filters
                            <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Bulk actions */}
                        {selectedAssets.length > 0 && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                        {selectedAssets.length} Selected
                                    </span>
                                    <button
                                        onClick={clearSelection}
                                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                        title="Clear selection"
                                    >
                                        <X size={15} />
                                    </button>
                                    <button
                                        onClick={handleBulkRestoreClick}
                                        disabled={actionLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw size={13} /> Restore Selected
                                    </button>
                                </motion.div>
                            </AnimatePresence>
                        )}

                        <div className="text-sm font-bold text-text-muted uppercase tracking-wider">
                            {filteredAssets.length} Records
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-3 p-4 bg-bg-dark/50 rounded-xl border border-border-color">
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-text-muted" />
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Category:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${categoryFilter === cat
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-bg-hover text-text-muted hover:text-primary hover:bg-primary/10'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border-color bg-bg-card">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-bg-dark border-b border-border-color">
                            <tr>
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary/50 bg-bg-card cursor-pointer accent-primary"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        title="Select All"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Asset Details</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Category</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Archived On</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Archive Reason</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Book Value</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            <AnimatePresence>
                                {filteredAssets.length > 0 ? (
                                    filteredAssets.map(asset => (
                                        <motion.tr
                                            key={asset.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`hover:bg-bg-hover transition-colors group ${selectedAssets.includes(asset.id) ? 'bg-primary/5' : ''}`}
                                        >
                                            {/* Checkbox */}
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary/50 bg-bg-card cursor-pointer accent-primary"
                                                    checked={selectedAssets.includes(asset.id)}
                                                    onChange={() => handleSelectAsset(asset.id)}
                                                />
                                            </td>

                                            {/* Asset Details */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-bg-dark border border-border-color overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={asset.image || asset.photo || getDefaultImage(asset)}
                                                            alt={asset.name}
                                                            className="w-full h-full object-cover opacity-60"
                                                            onError={(e) => { e.target.src = getDefaultImage(asset); }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-primary group-hover:text-primary transition-colors text-sm">{asset.name}</p>
                                                        <p className="text-[11px] text-text-muted font-mono mt-0.5">{asset.asset_id || asset.id}</p>
                                                        {asset.serial_number && (
                                                            <p className="text-[10px] text-text-muted/70">S/N: {asset.serial_number}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="p-4">
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                                                    {asset.category || '—'}
                                                </span>
                                            </td>

                                            {/* Archived On */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-text-muted">
                                                    <Calendar size={13} />
                                                    <span className="text-sm font-medium">{formatDate(asset.updated_at || asset.created_at)}</span>
                                                </div>
                                            </td>

                                            {/* Archive Reason */}
                                            <td className="p-4 max-w-[200px]">
                                                <p className="text-xs text-text-muted truncate" title={getArchiveReason(asset)}>
                                                    {getArchiveReason(asset)}
                                                </p>
                                            </td>

                                            {/* Book Value */}
                                            <td className="p-4">
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatCurrency(getBookValue(asset))}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => { setDetailAsset(asset); setIsDetailOpen(true); }}
                                                        className="p-2 rounded-lg bg-text-secondary/10 text-text-muted hover:bg-primary/10 hover:text-primary transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreClick(asset)}
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                        title="Restore to Inventory"
                                                        disabled={actionLoading}
                                                    >
                                                        <RefreshCw size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                    <Archive size={30} className="text-amber-400/50" />
                                                </div>
                                                <p className="font-bold text-text-primary">
                                                    {searchTerm || categoryFilter !== 'All' ? 'No archived assets match your filters.' : 'No archived assets found.'}
                                                </p>
                                                <p className="text-sm text-text-muted">
                                                    {searchTerm || categoryFilter !== 'All'
                                                        ? 'Try adjusting your search or filter criteria.'
                                                        : 'Assets that are archived from the Disposed Assets page will appear here.'}
                                                </p>
                                                {(searchTerm || categoryFilter !== 'All') && (
                                                    <button
                                                        onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
                                                        className="mt-1 text-sm font-bold text-primary hover:underline"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                        {filteredAssets.length > 0 && (
                            <tfoot className="bg-bg-dark/90 border-t-2 border-border-color">
                                <tr className="divide-x divide-transparent">
                                    <td colSpan={5} className="p-4 text-xs font-bold uppercase tracking-widest text-text-muted text-right">
                                        Total Book Value
                                    </td>
                                    <td className="p-4 text-base font-extrabold text-primary">
                                        {formatCurrency(filteredTotalBookValue)}
                                    </td>
                                    <td className="p-4"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* ── Detail Modal ───────────────────────────────────────────────── */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Archived Asset Details"
            >
                {detailAsset && (
                    <div className="space-y-5">
                        {/* Asset hero */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
                            <div className="w-20 h-20 rounded-xl bg-bg-dark border border-border-color overflow-hidden flex-shrink-0">
                                <img
                                    src={detailAsset.image || detailAsset.photo || getDefaultImage(detailAsset)}
                                    alt={detailAsset.name}
                                    className="w-full h-full object-cover opacity-70"
                                    onError={(e) => { e.target.src = getDefaultImage(detailAsset); }}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{detailAsset.name}</h3>
                                <p className="text-xs font-mono text-text-muted">{detailAsset.asset_id || detailAsset.id}</p>
                                <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/25">
                                    <Archive size={10} /> Archived
                                </span>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="bg-bg-hover/40 rounded-xl px-4 py-1 border border-border-color">
                            <DetailRow label="Category" value={detailAsset.category} />
                            <DetailRow label="Serial Number" value={detailAsset.serial_number} />
                            <DetailRow label="Custodian" value={detailAsset.custodian_name} />
                            <DetailRow label="Location / Division" value={detailAsset.location || detailAsset.division} />
                            <DetailRow label="Purchase / Book Value" value={formatCurrency(getBookValue(detailAsset))} />
                            <DetailRow label="Purchase Date" value={formatDate(detailAsset.purchase_date)} />
                            <DetailRow label="Archived On" value={formatDate(detailAsset.updated_at)} />
                            <DetailRow
                                label="Archive Reason"
                                value={getArchiveReason(detailAsset)}
                                highlight="text-amber-400"
                            />
                            {detailAsset.notes && (
                                <DetailRow label="Notes" value={detailAsset.notes} />
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setIsDetailOpen(false); handleRestoreClick(detailAsset); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold"
                            >
                                <RefreshCw size={15} /> Restore Asset
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Restore Modal ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {isRestoreOpen && (
                    <RestoreModal
                        isOpen={isRestoreOpen}
                        asset={restoreTarget}
                        onConfirm={handleRestoreConfirmFull}
                        onCancel={() => { setIsRestoreOpen(false); setRestoreTarget(null); }}
                        loading={actionLoading}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ArchivedAssets;
