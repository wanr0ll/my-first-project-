import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Search, Settings, Eye, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { getDefaultImage } from '../utils/assetImages';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

// ─── Restore Reason Modal ──────────────────────────────────────────────────
const RestoreReasonModal = ({ isOpen, onConfirm, onCancel, assetCount = 1 }) => {
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setReasonError('');
            setTimeout(() => textareaRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setReasonError('A restore reason is required.');
            textareaRef.current?.focus();
            return;
        }
        onConfirm(reason.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-bg-card border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <RefreshCw size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-base">
                            Restore {assetCount > 1 ? `${assetCount} Assets` : 'Asset'}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            This will move the {assetCount > 1 ? 'assets' : 'asset'} back to the main asset inventory.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">
                            Reason for Restoration <span className="text-emerald-400">*</span>
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }}
                            placeholder="e.g. Asset was mistakenly disposed, asset repaired and back in service, reclassification..."
                            rows={4}
                            className={`w-full bg-bg-dark border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none transition-colors ${reasonError ? 'border-emerald-500/60 focus:border-emerald-500' : 'border-border-color focus:border-emerald-500/50'
                                }`}
                        />
                        {reasonError && (
                            <p className="text-xs text-red-400 font-medium mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> {reasonError}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border border-border-color bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} /> Confirm Restore
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Archive Reason Modal ──────────────────────────────────────────────────
const ArchiveReasonModal = ({ isOpen, onConfirm, onCancel, assetCount = 1 }) => {
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setReasonError('');
            setTimeout(() => textareaRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setReasonError('An archive reason is required.');
            textareaRef.current?.focus();
            return;
        }
        onConfirm(reason.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-bg-card border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-amber-500/10 border-b border-amber-500/20">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Archive size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-base">
                            Archive {assetCount > 1 ? `${assetCount} Assets` : 'Asset'}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            This will safely archive the {assetCount > 1 ? 'assets' : 'asset'} and preserve historical records without permanently deleting.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">
                            Reason for Archiving <span className="text-amber-400">*</span>
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }}
                            placeholder="e.g. Asset reached end of disposal lifecycle, records archived for audit compliance..."
                            rows={4}
                            className={`w-full bg-bg-dark border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none transition-colors ${reasonError ? 'border-amber-500/60 focus:border-amber-500' : 'border-border-color focus:border-amber-500/50'
                                }`}
                        />
                        {reasonError && (
                            <p className="text-xs text-red-400 font-medium mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> {reasonError}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border border-border-color bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Archive size={14} /> Confirm Archive
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const DisposedAssets = () => {
    const { assets, updateAsset, loadAssets } = useAssets();
    const { user, permissions } = useAuth();
    const { addToast } = useToast();

    const canArchive = permissions?.canArchiveAsset ? permissions.canArchiveAsset(user) : true;
    const canRestore = permissions?.canRestoreAsset ? permissions.canRestoreAsset(user) : true;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Restore reason modal state
    const [restoreModal, setRestoreModal] = useState({ open: false, mode: null }); // mode: 'single' | 'bulk'

    // Archive reason modal state
    const [archiveModal, setArchiveModal] = useState({ open: false, mode: null }); // mode: 'single' | 'bulk'

    // ── Data ──────────────────────────────────────────────────────────────────
    const allAssets = Array.isArray(assets) ? assets : [];
    const disposedAssetsList = allAssets.filter(
        asset => asset.status === 'Disposed' || asset.status === 'Scrapped' || asset.status === 'Sold'
    );
    const filteredAssets = disposedAssetsList.filter(asset => {
        const term = searchTerm.toLowerCase();
        return (
            (asset.name && asset.name.toLowerCase().includes(term)) ||
            (asset.id && asset.id.toLowerCase().includes(term)) ||
            (asset.asset_id && asset.asset_id.toLowerCase().includes(term)) ||
            (asset.serial_number && asset.serial_number.toLowerCase().includes(term))
        );
    });

    // ── Selection helpers ─────────────────────────────────────────────────────
    const handleSelectAll = (e) => {
        setSelectedAssets(e.target.checked ? filteredAssets.map(a => a.id) : []);
    };
    const handleSelectAsset = (assetId) => {
        setSelectedAssets(prev =>
            prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
        );
    };
    const clearSelection = () => setSelectedAssets([]);

    // ── Single-row actions ────────────────────────────────────────────────────
    const handleViewDetails = (asset) => {
        setSelectedAsset(asset);
        setIsDetailModalOpen(true);
    };

    const handleRestoreSingle = (asset) => {
        setSelectedAsset(asset);
        setSelectedAssets([asset.id]);
        setRestoreModal({ open: true, mode: 'single' });
    };

    const handleArchiveSingle = (asset) => {
        setSelectedAsset(asset);
        setSelectedAssets([asset.id]);
        setArchiveModal({ open: true, mode: 'single' });
    };

    // ── Bulk action execution ─────────────────────────────────────────────────
    const executeBulkRestore = async (reason) => {
        setActionLoading(true);
        const targets = allAssets.filter(a => selectedAssets.includes(a.id));
        let successCount = 0;
        let failCount = 0;

        for (const asset of targets) {
            const result = await updateAsset(
                { ...asset, status: 'Active', restore_reason: reason },
                { silent: true, skipRefresh: true }
            );
            result.success ? successCount++ : failCount++;
        }

        await loadAssets();
        setActionLoading(false);
        setRestoreModal({ open: false, mode: null });
        setSelectedAssets([]);

        if (successCount > 0) addToast(`${successCount} asset(s) restored to inventory successfully`, 'success');
        if (failCount > 0) addToast(`${failCount} asset(s) failed to restore`, 'error');
    };

    const executeBulkArchive = async (reason) => {
        setActionLoading(true);
        const targets = allAssets.filter(a => selectedAssets.includes(a.id));
        let successCount = 0;
        let failCount = 0;

        for (const asset of targets) {
            const result = await updateAsset(
                { ...asset, status: 'Archived', archive_reason: reason },
                { silent: true, skipRefresh: true }
            );
            result.success ? successCount++ : failCount++;
        }

        await loadAssets();
        setActionLoading(false);
        setArchiveModal({ open: false, mode: null });
        setSelectedAssets([]);

        if (successCount > 0) addToast(`${successCount} asset(s) archived successfully`, 'success');
        if (failCount > 0) addToast(`${failCount} asset(s) failed to archive`, 'error');
    };

    const handleBulkRestore = () => {
        if (selectedAssets.length === 0) return;
        setRestoreModal({ open: true, mode: 'bulk' });
    };

    const handleRestoreConfirm = async (reason) => {
        await executeBulkRestore(reason);
    };

    const handleBulkArchive = () => {
        if (selectedAssets.length === 0) return;
        setArchiveModal({ open: true, mode: 'bulk' });
    };

    const handleArchiveConfirm = async (reason) => {
        await executeBulkArchive(reason);
    };

    const isAllSelected = filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length;
    const isIndeterminate = selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 pb-10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-primary">Disposed Assets</h1>
                    <p className="text-text-muted mt-1 font-medium">Archive of sold, scrapped, and disposed infrastructure.</p>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap justify-between items-center bg-bg-dark/50 p-4 rounded-xl border border-border-color gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} />
                        <input
                            type="text"
                            placeholder="Search disposed assets..."
                            className="w-full bg-bg-card border border-border-color rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedAssets.length > 0 && (
                            <>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                    {selectedAssets.length} Selected
                                </span>
                                <button
                                    onClick={() => { clearSelection(); }}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                                    title="Clear selection"
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    onClick={handleBulkRestore}
                                    disabled={actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                    title="Restore selected"
                                >
                                    <RefreshCw size={14} /> Restore
                                </button>
                                {canArchive && (
                                    <button
                                        onClick={handleBulkArchive}
                                        disabled={actionLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                        title="Archive selected"
                                    >
                                        <Archive size={14} /> Archive
                                    </button>
                                )}
                            </>
                        )}
                        <div className="text-sm font-bold text-text-muted uppercase tracking-wider">
                            {filteredAssets.length} Records Found
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border-color bg-bg-card">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-bg-dark border-b border-border-color">
                            <tr>
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary/50 bg-bg-card transition-all cursor-pointer accent-primary"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        title="Select All"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Asset Details</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Category</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Disposal Date</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Est. Book Value</th>
                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            <AnimatePresence>
                                {filteredAssets.length > 0 ? (
                                    filteredAssets.map(asset => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={asset.id}
                                            className={`hover:bg-bg-hover transition-colors group ${selectedAssets.includes(asset.id) ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary/50 bg-bg-card transition-all cursor-pointer accent-primary"
                                                    checked={selectedAssets.includes(asset.id)}
                                                    onChange={() => handleSelectAsset(asset.id)}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-bg-dark border border-border-color overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={asset.image || asset.photo || getDefaultImage(asset)}
                                                            alt={asset.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = getDefaultImage(asset);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                                                            {asset.name}
                                                        </p>
                                                        <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-text-muted mt-0.5">
                                                            ID: {asset.id || asset.asset_id || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-text-primary font-medium">{asset.major_category}</p>
                                                <p className="text-xs text-text-muted mt-0.5">{asset.asset_type}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-text-secondary">
                                                    {asset.updated_at
                                                        ? new Date(asset.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : 'N/A'}
                                                </p>
                                                <span className="badge badge-danger mt-1.5">{asset.status || 'Disposed'}</span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-text-primary font-mono">
                                                    GHS {parseFloat(asset.purchase_cost || 0).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Original Cost</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleViewDetails(asset)}
                                                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors inline-block mr-1"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {canRestore && (
                                                    <button
                                                        onClick={() => handleRestoreSingle(asset)}
                                                        className="p-2 rounded-lg text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors inline-block"
                                                        title="Restore Asset"
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                )}
                                                {canArchive && (
                                                    <button
                                                        onClick={() => handleArchiveSingle(asset)}
                                                        className="p-2 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors inline-block ml-1"
                                                        title="Archive Asset"
                                                    >
                                                        <Archive size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-text-muted">
                                            <div className="w-16 h-16 bg-bg-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-border-color">
                                                <Archive className="text-text-muted opacity-50" size={24} />
                                            </div>
                                            <p className="font-medium">No disposed assets found</p>
                                            <p className="text-xs mt-1">Filters or empty records returned zero results.</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Asset Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Disposed Asset Details">
                {selectedAsset && (
                    <div className="p-6 space-y-6">
                        <div className="flex border-b border-border-color pb-6 gap-6">
                            <div className="w-32 h-32 rounded-xl bg-bg-dark border border-border-color overflow-hidden flex-shrink-0">
                                <img
                                    src={selectedAsset.image || selectedAsset.photo || getDefaultImage(selectedAsset)}
                                    alt={selectedAsset.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-text-primary">{selectedAsset.name}</h3>
                                    <span className="badge badge-danger">DISPOSED</span>
                                </div>
                                <p className="text-sm font-mono text-text-muted mt-1 tracking-wider uppercase">{selectedAsset.id || selectedAsset.asset_id || 'N/A'}</p>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Division</p>
                                        <p className="text-sm font-medium text-text-primary mt-0.5">{selectedAsset.division || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Original Cost</p>
                                        <p className="text-sm font-medium text-text-primary mt-0.5">GHS {parseFloat(selectedAsset.purchase_cost || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Settings size={14} /> Description
                            </h4>
                            <p className="text-sm text-text-secondary leading-relaxed bg-bg-dark p-4 rounded-xl border border-border-color">
                                {selectedAsset.notes || 'No description available for this disposed asset.'}
                            </p>
                        </div>

                        {/* Quick actions inside modal */}
                        <div className="flex gap-3 pt-2 border-t border-border-color">
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    handleRestoreSingle(selectedAsset);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                                <RefreshCw size={15} /> Restore Asset
                            </button>
                            {canArchive && (
                                <button
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        handleArchiveSingle(selectedAsset);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                >
                                    <Archive size={15} /> Archive Asset
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Restore Reason Modal */}
            <AnimatePresence>
                {restoreModal.open && (
                    <RestoreReasonModal
                        isOpen={restoreModal.open}
                        assetCount={selectedAssets.length}
                        onConfirm={handleRestoreConfirm}
                        onCancel={() => setRestoreModal({ open: false, mode: null })}
                    />
                )}
            </AnimatePresence>

            {/* Archive Reason Modal */}
            <AnimatePresence>
                {archiveModal.open && (
                    <ArchiveReasonModal
                        isOpen={archiveModal.open}
                        assetCount={selectedAssets.length}
                        onConfirm={handleArchiveConfirm}
                        onCancel={() => setArchiveModal({ open: false, mode: null })}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DisposedAssets;
