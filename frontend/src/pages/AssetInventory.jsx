import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, Download, Plus, Search, Clock, Edit2, Trash2, AlertCircle, Laptop, Truck, Armchair, Home, Check, X, History, QrCode, LogOut, LogIn, ArrowRightLeft, Boxes, Building2, Package, Printer, Upload, Wrench, CheckSquare, Square, Eye, AlertTriangle, ZoomIn } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAssets } from '../context/AssetContext';
import { AnimatePresence, motion } from 'framer-motion';
import AddAssetModal from '../components/AddAssetModal';
import ImportAssetModal from '../components/ImportAssetModal';
import TransferAssetModal from '../components/TransferAssetModal';
import BulkTransferModal from '../components/BulkTransferModal';
import { calculateDepreciation } from '../utils/depreciation';
import { getDefaultImage } from '../utils/assetImages';
import * as API from '../services/api';

// ─── Disposal Reason Modal ──────────────────────────────────────────────────
const DisposeReasonModal = ({ isOpen, onConfirm, onCancel, assetCount = 1 }) => {
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
            setReasonError('A disposal reason is required.');
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
                className="relative w-full max-w-md bg-bg-card border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border-b border-red-500/20">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-base">
                            Dispose {assetCount > 1 ? `${assetCount} Assets` : 'Asset'}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            This will move the {assetCount > 1 ? 'assets' : 'asset'} to the Disposed Assets register.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">
                            Reason for Disposal <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }}
                            placeholder="e.g. Asset is beyond economical repair, End of useful life, Sold at auction..."
                            rows={4}
                            className={`w-full bg-bg-dark border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none transition-colors ${
                                reasonError ? 'border-red-500/60 focus:border-red-500' : 'border-border-color focus:border-red-500/50'
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
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Confirm Disposal
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Badge = ({ status }) => {
    let colorClass = "";
    if (!status) return <span className="text-text-muted italic text-[10px]">No Status</span>;
    const s = status.toLowerCase();

    if (s === 'active' || s === 'in service' || s === 'completed' || s === 'good' || s === 'approved') colorClass = "badge-success";
    else if (s === 'pending approval' || s === 'ongoing' || s === 'fair' || s === 'idle') colorClass = "badge-warning";
    else if (s === 'rejected' || s === 'critical' || s === 'maintenance' || s === 'under maintenance' || s === 'failure' || s === 'damaged' || s === 'lost' || s === 'obsolete') colorClass = "badge-danger";
    else if (s === 'checked out' || s === 'borrowed' || s === 'transferred') colorClass = "bg-primary/20 text-primary border border-primary/30";
    else colorClass = "bg-bg-hover text-text-muted border border-border-color";

    return <span className={`badge ${colorClass}`}>{status}</span>;
}

const TableRow = ({ data, columns, onDetails, onApprove, onReject, onDelete, onHistory, onTransfer, onEdit, permissions, user, isSelected, onToggleSelect }) => (
    <tr className={`border-b border-border-color hover:bg-bg-hover/30 transition-colors group ${isSelected ? 'bg-primary/5 border-primary/20' : ''}`}>
        <td className="py-3.5 pl-4 pr-2">
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSelect(data.id);
                }}
                className={`transition-colors ${isSelected ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
                {isSelected ? <CheckSquare size={18} strokeWidth={2} /> : <Square size={18} strokeWidth={1.5} />}
            </button>
        </td>
        {columns.map((col, idx) => (
            <td key={idx} className="py-3.5 px-4 text-sm text-text-secondary group-hover:text-text-primary transition-colors first:font-semibold first:text-text-primary whitespace-nowrap">
                {col.render ? col.render(data) : data[col.key]}
            </td>
        ))}
        <td className="py-3 px-3">
            <div className="flex items-center justify-end gap-1">
                {data.approval_status === 'Pending' && permissions.canApproveAsset(user, data) && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApprove(data); }}
                            className="p-1.5 rounded-md border border-success/30 bg-success/5 text-success hover:bg-success hover:text-white hover:border-success hover:shadow-sm hover:shadow-success/20 transition-all active:scale-95"
                            title="Approve Asset"
                        >
                            <Check size={13} strokeWidth={3} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReject(data); }}
                            className="p-1.5 rounded-md border border-danger/30 bg-danger/5 text-danger hover:bg-danger hover:text-white hover:border-danger hover:shadow-sm hover:shadow-danger/20 transition-all active:scale-95"
                            title="Reject Asset"
                        >
                            <X size={13} strokeWidth={3} />
                        </button>
                    </>
                )}
                {permissions.canTransferAssets(user) && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(data); }}
                        className="p-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-sm hover:shadow-cyan-500/20 transition-all active:scale-95"
                        title="Transfer Asset"
                    >
                        <ArrowRightLeft size={13} strokeWidth={2.5} />
                    </button>
                )}
                {permissions.canViewHistory(user) && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHistory(data); }}
                        className="p-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 hover:shadow-sm hover:shadow-amber-500/20 transition-all active:scale-95"
                        title="View History"
                    >
                        <History size={13} strokeWidth={2.5} />
                    </button>
                )}
                {permissions.canViewDetails(user) && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDetails(); }}
                        className="p-1.5 rounded-md border border-slate-400/30 bg-slate-400/5 text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-white hover:border-slate-500 hover:shadow-sm transition-all active:scale-95"
                        title="View Details"
                    >
                        <Eye size={13} strokeWidth={2.5} />
                    </button>
                )}
                {permissions.canEditAsset(user) && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(data); }}
                        className="p-1.5 rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-sm hover:shadow-primary/20 transition-all active:scale-95"
                        title="Edit Asset"
                    >
                        <Edit2 size={13} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </td>
    </tr>
);




const AssetInventory = () => {
    const { user, permissions } = useAuth();
    const { addToast } = useToast();
    useNotifications();
    const { assets, updateAsset, deleteAsset, loading } = useAssets();

    const [activeTab, setActiveTab] = useState('fixed-moveable');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedAssetStats, setSelectedAssetStats] = useState({ transfers: 0, maintenance: 0, loading: false });
    const [assetHistory, setAssetHistory] = useState([]);
    const [assetMaintenance, setAssetMaintenance] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [divisionFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBatchTransferOpen, setIsBatchTransferOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);

    // ── Disposal reason modal state ───────────────────────────────────────────
    const [disposeModal, setDisposeModal] = useState({ open: false, mode: null }); // mode: 'single' | 'bulk'
    const [pendingDisposeStatus, setPendingDisposeStatus] = useState(null); // for single status-change to non-Disposed statuses too

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && zoomedImage) {
                setZoomedImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomedImage]);

    const isInactive = (a) => ['archived', 'disposed', 'scrapped', 'sold'].includes((a.status || a.Status || '').toLowerCase());

    const tabs = [
        { id: 'all-approved', label: 'All Approved', icon: Boxes, count: (assets || []).filter(a => a.approval_status === 'Approved' && !isInactive(a)).length },
        { id: 'fixed-moveable', label: 'Fixed Moveable', icon: Truck, count: (assets || []).filter(a => a.major_category === 'Fixed Asset' && a.asset_type === 'Moveable' && a.approval_status === 'Approved' && !isInactive(a)).length },
        { id: 'fixed-non-moveable', label: 'Fixed Non-Moveable', icon: Building2, count: (assets || []).filter(a => a.major_category === 'Fixed Asset' && a.asset_type === 'Non Moveable' && a.approval_status === 'Approved' && !isInactive(a)).length },
        { id: 'non-fixed', label: 'Non-Fixed Assets', icon: Package, count: (assets || []).filter(a => a.major_category === 'Non Fixed Asset' && a.approval_status === 'Approved' && !isInactive(a)).length },
        { id: 'pending', label: 'Pending Approval', icon: Clock, count: (assets || []).filter(a => a.approval_status === 'Pending' && !isInactive(a)).length }
    ];

    const location = useLocation();

    useEffect(() => {
        if (location.state?.filter) {
            const filterState = location.state.filter;
            if (filterState === 'Pending Approval') {
                setActiveTab('pending');
                setStatusFilter('All');
            } else if (filterState === 'Approved') {
                setActiveTab('all-approved');
                setStatusFilter('All');
            } else if (filterState === 'Active') {
                setActiveTab('all-approved');
                setStatusFilter('Active');
            } else if (filterState === 'Maintenance') {
                setActiveTab('all-approved');
                setStatusFilter('Maintenance');
            }

            // Clear the state so it doesn't re-trigger on subsequent renders
            window.history.replaceState({}, document.title);
        } else {
            // Set default tab on normal load
            if (!location.state) {
                setActiveTab('all-approved');
            }
        }
    }, [location.state]);

    const columns = [
        {
            key: 'image', label: '', render: (d) => {
                const imgSrc = d.image || getDefaultImage(d);
                return (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (imgSrc) setZoomedImage({ src: imgSrc, title: d.name, id: d.id });
                        }}
                        className={`w-16 h-16 rounded-xl overflow-hidden bg-bg-hover/50 flex items-center justify-center shadow-sm relative group transition-transform ${imgSrc ? 'cursor-pointer hover:scale-105 hover:shadow-md' : ''}`}
                        title={imgSrc ? 'Click to enlarge image' : ''}
                    >
                        {imgSrc ? (
                            <>
                                <img src={imgSrc} alt={d.name} className="w-full h-full object-cover transition-all group-hover:brightness-90" />
                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ZoomIn size={18} />
                                </div>
                            </>
                        ) : (
                            <Package size={24} className="text-text-muted" />
                        )}
                    </div>
                );
            }
        },
        { key: 'id', label: 'Asset ID' },
        { key: 'name', label: 'Asset Name' },
        { key: 'category', label: 'Category' },
        { key: 'division', label: 'Division' },
        { key: 'status', label: 'Status', render: (d) => <Badge status={d.status || d.Status} /> }
    ];

    const filteredData = (assets || []).filter(item => {
        // Always exclude disposed/scrapped/sold/archived assets from inventory view
        const itemStatus = (item.status || item.Status || '').toLowerCase();
        if (itemStatus === 'disposed' || itemStatus === 'scrapped' || itemStatus === 'sold' || itemStatus === 'archived') return false;

        // Tab Filtering
        if (activeTab === 'all-approved') {
            if (item.approval_status !== 'Approved') return false;
        } else if (activeTab === 'fixed-moveable') {
            if (item.major_category !== 'Fixed Asset' || item.asset_type !== 'Moveable' || item.approval_status !== 'Approved') return false;
        } else if (activeTab === 'fixed-non-moveable') {
            if (item.major_category !== 'Fixed Asset' || item.asset_type !== 'Non Moveable' || item.approval_status !== 'Approved') return false;
        } else if (activeTab === 'non-fixed') {
            if (item.major_category !== 'Non Fixed Asset' || item.approval_status !== 'Approved') return false;
        } else if (activeTab === 'pending') {
            if (item.approval_status !== 'Pending') return false;
        }

        // Status Filtering
        if (statusFilter !== 'All') {
            const assetStatus = (item.status || item.Status || '').toLowerCase();
            const filterTarget = statusFilter.toLowerCase();

            // Handle basic exact match first
            if (assetStatus !== filterTarget) {
                // Check edge cases like "Under Maintenance"
                if (filterTarget === 'maintenance' && assetStatus === 'under maintenance') {
                    // Match allowed
                } else {
                    return false;
                }
            }
        }

        // Search and Division Filtering
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(searchLower) || item.id.toLowerCase().includes(searchLower);
        const matchesDivision = divisionFilter === 'All' || item.division === divisionFilter;

        return matchesSearch && matchesDivision;
    });

    const handleApprove = async (asset) => {
        const result = await updateAsset({ ...asset, approval_status: 'Approved' });
        if (result.success) addToast('Asset Approved', 'success');
    };

    const handleReject = async (asset) => {
        const result = await updateAsset({ ...asset, approval_status: 'Rejected' });
        if (result.success) addToast('Asset Rejected', 'warning');
    };

    // --- Batch Action Handlers ---
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(a => a.id));
        }
    };

    const handleBulkApprove = async () => {
        const targets = filteredData.filter(a => selectedIds.includes(String(a.id)) && a.approval_status === 'Pending');
        if (targets.length === 0) { addToast('No pending assets selected to approve', 'warning'); return; }
        let count = 0;
        for (const asset of targets) {
            const res = await updateAsset({ ...asset, approval_status: 'Approved' });
            if (res.success) count++;
        }
        addToast(`${count} asset(s) approved successfully`, 'success');
        setSelectedIds([]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDisposeModal({ open: true, mode: 'bulk' });
    };

    const executeBulkDispose = async (reason) => {
        setDisposeModal({ open: false, mode: null });
        let count = 0;
        for (const id of selectedIds) {
            const asset = filteredData.find(a => String(a.id) === id);
            if (asset) {
                const res = await updateAsset({ ...asset, status: 'Disposed', details: reason, disposal_reason: reason });
                if (res?.success) count++;
            }
        }
        addToast(`${count} asset(s) disposed successfully`, 'success');
        setSelectedIds([]);
    };

    const handleBulkTransfer = () => {
        if (selectedIds.length === 0) return;
        setIsBatchTransferOpen(true);
    };

    const clearSelection = () => setSelectedIds([]);

    const handleDetailsClick = async (asset) => {
        setSelectedAsset(asset);
        setIsDetailModalOpen(true);
        setSelectedAssetStats({ transfers: 0, maintenance: 0, loading: true });
        setAssetMaintenance([]);

        try {
            // Fetch history and maintenance in parallel
            const [historyRes, maintRes] = await Promise.all([
                API.getAssetHistory(asset.id),
                API.getMaintenanceByAsset(asset.id)
            ]);

            if (historyRes.success && historyRes.data) {
                const history = historyRes.data;
                const transfers = history.filter(h => h.action.includes('Transfer')).length;
                const maintenance = history.filter(h => h.action.includes('Maintained') || h.action.includes('Maintenance')).length;
                setSelectedAssetStats({ transfers, maintenance, loading: false });
            } else {
                setSelectedAssetStats({ transfers: 0, maintenance: 0, loading: false });
            }

            if (maintRes.success && maintRes.data) {
                // Only show completed tasks that have actual_cost or parts_maintained
                const completed = maintRes.data.filter(t =>
                    t.status === 'Completed' && (t.actual_cost || t.parts_maintained)
                );
                setAssetMaintenance(completed);
            }
        } catch (e) {
            console.error('Details Fetch Error:', e);
            setSelectedAssetStats({ transfers: 0, maintenance: 0, loading: false });
        }
    };

    const handleHistoryClick = async (asset) => {
        setSelectedAsset(asset);
        setLoadingHistory(true);
        setIsHistoryModalOpen(true);
        try {
            const response = await API.getAssetHistory(asset.id);
            if (response.success) {
                setAssetHistory(response.data || []);
            } else {
                addToast('Failed to load history', 'error');
            }
        } catch (error) {
            console.error('History Error:', error);
            addToast('Error loading asset history', 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDelete = (asset) => {
        setSelectedAsset(asset);
        setDisposeModal({ open: true, mode: 'single' });
    };

    const executeDispose = async (reason) => {
        setDisposeModal({ open: false, mode: null });
        const target = selectedAsset;
        if (!target) return;
        const result = await updateAsset({ ...target, status: 'Disposed', details: reason, disposal_reason: reason });
        if (result.success) addToast('Asset disposed successfully', 'success');
        else addToast('Failed to dispose asset', 'error');
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedAsset) return;
        // Intercept disposal - show reason modal instead of immediately updating
        if (newStatus === 'Disposed') {
            setDisposeModal({ open: true, mode: 'single' });
            return;
        }
        const result = await updateAsset({ ...selectedAsset, status: newStatus });
        if (result.success) {
            setSelectedAsset(prev => ({ ...prev, status: newStatus }));
            addToast(`Status updated to ${newStatus}`, 'success');
        } else {
            addToast('Failed to update status', 'error');
        }
    };

    // Called when disposal modal confirms (works for both single from detail modal and from table row)
    const handleDisposeConfirm = async (reason) => {
        if (disposeModal.mode === 'bulk') {
            await executeBulkDispose(reason);
        } else {
            await executeDispose(reason);
            // If disposed from details modal, close it and reset status select
            if (selectedAsset) {
                setSelectedAsset(prev => prev ? { ...prev, status: 'Disposed' } : prev);
            }
        }
    };

    const handlePrint = (asset) => {
        const printDepr = calculateDepreciation(asset);
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
            <head>
                <title>Asset Record - ${asset.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
                    .print-container { max-width: 800px; mx-auto; }
                    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
                    .brand-info { flex: 1; }
                    .brand-title { font-size: 28px; font-weight: 800; margin: 0; color: #000; letter-spacing: -0.02em; }
                    .brand-subtitle { font-size: 14px; color: #444; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
                    .logo { height: 80px; width: auto; object-fit: contain; }
                    
                    .section-title { font-size: 12px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 0.15em; margin: 30px 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                    
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                    .item { display: flex; flex-direction: column; }
                    .label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 6px; }
                    .value { font-size: 15px; font-weight: 600; color: #111; }
                    
                    .asset-image-container { float: right; width: 180px; height: 180px; margin-left: 30px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; }
                    .asset-image { width: 100%; height: 100%; object-fit: cover; }
                    
                    .financial-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; margin-top: 30px; }
                    .financial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                    
                    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #999; }
                    .timestamp { font-weight: bold; color: #666; }
                    
                    @media print { 
                        body { padding: 20px; }
                        .no-print { display: none; }
                        .financial-box { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <div class="brand-info">
                            <h1 class="brand-title">GHANA HIGHWAY AUTHORITY</h1>
                            <p class="brand-subtitle">Asset Management System | Official Record</p>
                        </div>
                        <img src="/logo.png" class="logo" alt="GHA Logo" />
                    </div>

                    <div style="overflow: hidden;">
                        ${asset.image ? `<div class="asset-image-container"><img src="${asset.image}" class="asset-image" /></div>` : ''}
                        
                        <div class="section-title">General Information</div>
                        <div class="grid">
                            <div class="item"><div class="label">Asset Name / Model</div><div class="value">${asset.name}</div></div>
                            <div class="item"><div class="label">Asset ID (AIN)</div><div class="value" style="font-family: monospace; font-size: 16px;">${asset.id}</div></div>
                             <div class="item"><div class="label">Major Category</div><div class="value">${asset.major_category}</div></div>
                             <div class="item"><div class="label">Sub Category</div><div class="value">${asset.asset_type || 'N/A'}</div></div>
                             <div class="item"><div class="label">Specific Category</div><div class="value">${asset.category}</div></div>
                            <div class="item"><div class="label">Operational Status</div><div class="value" style="color: ${asset.status?.toLowerCase() === 'active' ? '#008744' : '#d62d20'}">${asset.status}</div></div>
                        </div>
                    </div>

                    <div class="section-title">Ownership & Location</div>
                    <div class="grid">
                        <div class="item"><div class="label">Reporting Division</div><div class="value">${asset.division}</div></div>
                        <div class="item"><div class="label">Owner Division</div><div class="value">${asset.owner_division || asset.division}</div></div>
                        <div class="item"><div class="label">Physical Location</div><div class="value">${asset.location || 'Not Specified'}</div></div>
                        <div class="item"><div class="label">Custodian Name</div><div class="value">${asset.custodian_name || 'N/A'}</div></div>
                        <div class="item"><div class="label">Custodian ID</div><div class="value">${asset.custodian_id || 'N/A'}</div></div>
                    </div>

                    ${(asset.plate_number || asset.serial_number || asset.chassis_number || asset.engine_number) ? `
                        <div class="section-title">Technical Identifiers</div>
                        <div class="grid">
                            ${asset.plate_number ? `<div class="item"><div class="label">Plate Number</div><div class="value">${asset.plate_number}</div></div>` : ''}
                            ${asset.serial_number ? `<div class="item"><div class="label">Serial / Asset Tag</div><div class="value">${asset.serial_number}</div></div>` : ''}
                            ${asset.chassis_number ? `<div class="item"><div class="label">Chassis Number</div><div class="value">${asset.chassis_number}</div></div>` : ''}
                            ${asset.engine_number ? `<div class="item"><div class="label">Engine Number</div><div class="value">${asset.engine_number}</div></div>` : ''}
                            ${asset.sub_type ? `<div class="item"><div class="label">Asset Type</div><div class="value">${asset.sub_type}</div></div>` : ''}
                        </div>
                    ` : ''}

                    <div class="financial-box">
                        <div class="label" style="margin-bottom: 15px; color: #475569;">Financial Details</div>
                        <div class="financial-grid" style="grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 15px;">
                            <div class="item"><div class="label">Purchase Cost</div><div class="value">GHS ${Number(asset.purchase_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                            <div class="item"><div class="label">Purchase Date</div><div class="value">${asset.purchase_date || 'N/A'}</div></div>
                            <div class="item"><div class="label">Useful Life</div><div class="value">${asset.useful_life || '5'} Years</div></div>
                        </div>
                        ${printDepr.isDepreciable ? `
                        <div class="financial-grid" style="grid-template-columns: repeat(2, 1fr); gap: 20px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                            <div class="item"><div class="label" style="color: #d62d20;">Accumulated Depreciation</div><div class="value" style="color: #d62d20;">GHS ${printDepr.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                            <div class="item"><div class="label" style="color: #008744;">Net Book Value</div><div class="value" style="color: #008744;">GHS ${printDepr.currentBookValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                        </div>
                        ` : ''}
                    </div>

                    ${asset.notes ? `
                        <div class="section-title">Notes & Specifications</div>
                        <div style="background: #fff; border-left: 4px solid #eee; padding: 15px; font-size: 14px; color: #444; white-space: pre-wrap;">${asset.notes}</div>
                    ` : ''}

                    <div class="footer">
                        <p>This is a system-generated document from the GHA Asset Management System.</p>
                        <p>Printed on <span class="timestamp">${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</span></p>
                    </div>
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    const handleExportCSV = () => {
        if (!filteredData || filteredData.length === 0) {
            addToast('No data to export', 'info');
            return;
        }

        // Define headers
        const headers = ['Asset ID', 'Name', 'Major Category', 'Category', 'Division', 'Status', 'Condition', 'Purchase Cost', 'Purchase Date'];

        // Map data to rows
        const rows = filteredData.map(asset => [
            asset.id,
            `"${asset.name}"`,
            asset.major_category,
            asset.category,
            asset.division,
            asset.status,
            asset.asset_condition || 'N/A',
            asset.purchase_cost || '0',
            asset.purchase_date || 'N/A'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `GHA_Assets_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('Inventory exported successfully', 'success');
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Asset Inventory</h1>
                    <p className="text-text-secondary mt-1.5 text-sm">Centrally managing all GHA assets across new hierarchical categories.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 border border-border-color bg-bg-card/50 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
                    >
                        <Download size={16} /> Export
                    </button>
                    {permissions.canAddAsset(user) && (
                        <>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-bg-hover text-text-primary rounded-lg text-sm font-medium hover:bg-bg-card transition-all active:scale-95 border border-border-color"
                            >
                                <Upload size={16} /> Bulk Import
                            </button>
                            <button onClick={() => { setSelectedAsset(null); setIsAddModalOpen(true); }} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                                <Plus size={16} strokeWidth={2.5} /> Add Asset
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-border-color px-2 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2.5 whitespace-nowrap shrink-0
                                ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-bg-hover text-text-muted'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-b border-border-color flex flex-wrap items-center gap-4 bg-bg-hover/10">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="text-text-muted" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-bg-card border border-border-color rounded-lg text-sm px-3 py-2 text-text-secondary focus:outline-none focus:border-primary/50"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Disposed">Disposed</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto min-w-0 w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-hover/20">
                                <th className="py-3 pl-4 pr-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectAll();
                                        }}
                                        className={`transition-colors ${selectedIds.length > 0 && selectedIds.length === filteredData.length ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
                                        title="Select All"
                                    >
                                        {selectedIds.length > 0 && selectedIds.length === filteredData.length
                                            ? <CheckSquare size={18} strokeWidth={2} />
                                            : <Square size={18} strokeWidth={1.5} />}
                                    </button>
                                </th>
                                {columns.map(col => <th key={col.key} className="py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] whitespace-nowrap">{col.label}</th>)}
                                <th className="py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={columns.length + 2} className="py-20 text-center text-text-muted font-medium">Loading assets...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={columns.length + 2} className="py-20 text-center text-text-muted font-medium">No assets found in this category.</td></tr>
                            ) : (
                                filteredData.map(asset => (
                                    <TableRow
                                        key={asset.id}
                                        data={asset}
                                        columns={columns}
                                        onDetails={() => handleDetailsClick(asset)}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onDelete={handleDelete}
                                        onHistory={(a) => handleHistoryClick(a)}
                                        onTransfer={(a) => { setSelectedAsset(a); setIsTransferModalOpen(true); }}
                                        onEdit={(a) => { setSelectedAsset(a); setIsAddModalOpen(true); }}
                                        permissions={permissions}
                                        user={user}
                                        isSelected={selectedIds.includes(String(asset.id))}
                                        onToggleSelect={handleToggleSelect}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-bg-card) 0%, color-mix(in srgb, var(--color-bg-card) 90%, var(--color-primary)) 100%)',
                            border: '1px solid color-mix(in srgb, var(--color-border-color) 60%, var(--color-primary))',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div className="flex items-center gap-2 pr-3 border-r border-border-color">
                            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                                {selectedIds.length}
                            </div>
                            <span className="text-sm font-bold text-text-primary">
                                {selectedIds.length === 1 ? '1 asset selected' : `${selectedIds.length} assets selected`}
                            </span>
                        </div>

                        {permissions.canApproveAsset(user, {}) && (
                            <button
                                onClick={handleBulkApprove}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success hover:text-white transition-all text-sm font-semibold"
                            >
                                <Check size={15} strokeWidth={2.5} /> Approve All
                            </button>
                        )}

                        {permissions.canTransferAssets(user) && (
                            <button
                                onClick={handleBulkTransfer}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-sm font-semibold"
                            >
                                <ArrowRightLeft size={15} /> Transfer All
                            </button>
                        )}

                        {permissions.canArchiveAsset(user) && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all text-sm font-semibold"
                            >
                                <Trash2 size={15} /> Dispose Asset
                            </button>
                        )}

                        <button
                            onClick={clearSelection}
                            className="ml-1 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
                            title="Clear Selection"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AddAssetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                assetToEdit={selectedAsset}
            />

            <ImportAssetModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />

            {/* Batch Transfer Modal — passes ALL selected assets */}
            <BulkTransferModal
                isOpen={isBatchTransferOpen}
                onClose={() => { setIsBatchTransferOpen(false); clearSelection(); }}
                assets={filteredData.filter(a => selectedIds.includes(String(a.id)))}
            />

            {/* Asset Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Asset Details" size="2xl">
                {selectedAsset && (() => {
                    const depr = calculateDepreciation(selectedAsset);
                    const totalMaintCost = assetMaintenance.reduce((sum, t) => sum + (parseFloat(t.service_cost || t.actual_cost) || 0), 0);
                    const adjustedBookValue = depr.isDepreciable ? depr.currentBookValue + totalMaintCost : null;

                    const ignoredKeys = [
                        'id', 'name', 'category', 'major_category', 'asset_type', 'sub_type',
                        'location', 'assigned_to', 'division', 'owner_division', 'room_no', 'room_name',
                        'custodian_name', 'custodian_id', 'custodian_address', 'custodian_mobile',
                        'status', 'approval_status', 'image', 'notes', 'created_at', 'updated_at',
                        'plate_number', 'chassis_number', 'engine_number', 'serial_number', 'quantity',
                        'asset_condition', 'purchase_cost', 'purchase_date', 'useful_life',
                        'warranty_expiry', 'created_by', 'Status', 'brand_name', 'model', 'year_of_manufacture'
                    ];
                    const extraKeys = Object.keys(selectedAsset).filter(key =>
                        !ignoredKeys.includes(key) && selectedAsset[key] !== null && selectedAsset[key] !== '' && typeof selectedAsset[key] !== 'object'
                    );

                    const Field = ({ label, value, span = false }) => value ? (
                        <div className={span ? 'col-span-2' : ''}>
                            <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest block">{label}</span>
                            <p className="text-sm font-semibold text-text-primary mt-0.5">{value}</p>
                        </div>
                    ) : null;

                    const SectionHeader = ({ icon: Icon, label, color = 'text-text-muted', bg = 'bg-bg-hover/30', border = 'border-border-color' }) => (
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl ${bg} border-b ${border}`}>
                            <Icon size={13} className={color} />
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${color}`}>{label}</span>
                        </div>
                    );

                    return (
                        <div className="space-y-4">
                            {/* ── Header: Image + Name + Badges ── */}
                            <div className="flex items-start gap-5 p-4 bg-bg-hover/20 rounded-xl border border-border-color">
                                <div
                                    onClick={() => {
                                        const imgSrc = selectedAsset.image || getDefaultImage(selectedAsset);
                                        if (imgSrc) setZoomedImage({ src: imgSrc, title: selectedAsset.name, id: selectedAsset.id });
                                    }}
                                    className={`w-24 h-24 rounded-xl bg-bg-hover border border-border-color overflow-hidden flex-shrink-0 relative group transition-transform ${
                                        (selectedAsset.image || getDefaultImage(selectedAsset)) ? 'cursor-pointer hover:scale-105 hover:shadow-md' : ''
                                    }`}
                                    title={(selectedAsset.image || getDefaultImage(selectedAsset)) ? 'Click to enlarge image' : ''}
                                >
                                    {(selectedAsset.image || getDefaultImage(selectedAsset)) ? (
                                        <>
                                            <img src={selectedAsset.image || getDefaultImage(selectedAsset)} className="w-full h-full object-cover transition-all group-hover:brightness-90" alt={selectedAsset.name} />
                                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                <ZoomIn size={22} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted"><Package size={28} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{selectedAsset.id}</p>
                                    <h3 className="text-lg font-extrabold text-text-primary mt-0.5 leading-tight">{selectedAsset.name}</h3>
                                    <p className="text-xs text-text-secondary mt-1">{selectedAsset.major_category} · {selectedAsset.asset_type} · {selectedAsset.category}</p>
                                    <div className="flex gap-2 mt-2.5 flex-wrap">
                                        {permissions.canAddAsset(user) ? (
                                            <select
                                                value={selectedAsset.status}
                                                onChange={(e) => handleStatusChange(e.target.value)}
                                                className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-border-color bg-bg-card text-text-primary focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Maintenance">Maintenance</option>
                                                <option value="Disposed">Disposed</option>
                                                <option value="Good">Good</option>
                                                <option value="Fair">Fair</option>
                                                <option value="Poor">Poor</option>
                                            </select>
                                        ) : (
                                            <Badge status={selectedAsset.status} />
                                        )}
                                        <Badge status={selectedAsset.approval_status} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Stats Bar ── */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-border-color bg-bg-hover/20 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                        <ArrowRightLeft size={15} className="text-cyan-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-text-muted">Previously Transferred</span>
                                        <p className="text-sm font-bold text-text-primary mt-0.5">
                                            {selectedAssetStats.loading ? '...' : selectedAssetStats.transfers > 0 ? `Yes (${selectedAssetStats.transfers}×)` : 'Never'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl border border-border-color bg-bg-hover/20 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <Wrench size={15} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-text-muted">Maintained Before</span>
                                        <p className="text-sm font-bold text-text-primary mt-0.5">
                                            {selectedAssetStats.loading ? '...' : selectedAssetStats.maintenance > 0 ? `Yes (${selectedAssetStats.maintenance}×)` : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 1: General Info ── */}
                            <div className="rounded-xl border border-border-color overflow-hidden">
                                <SectionHeader icon={Package} label="General Info" color="text-text-muted" bg="bg-bg-hover/40" />
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <Field label="Asset Name" value={selectedAsset.name} span />
                                    <Field label="Major Category" value={selectedAsset.major_category} />
                                    <Field label="Sub Category" value={selectedAsset.asset_type} />
                                    <Field label="Specific Category" value={selectedAsset.category} />
                                    <Field label="Asset Type" value={selectedAsset.sub_type} />
                                    <Field label="Reporting Division" value={selectedAsset.division} />
                                    {selectedAsset.brand_name && <Field label="Brand" value={selectedAsset.brand_name} />}
                                    {selectedAsset.model && <Field label="Model" value={selectedAsset.model} />}
                                    {selectedAsset.year_of_manufacture && <Field label="Year of Manufacture" value={selectedAsset.year_of_manufacture} />}
                                    {selectedAsset.asset_condition && <Field label="Condition" value={selectedAsset.asset_condition} />}
                                </div>
                            </div>

                            {/* ── Section 2: Specifications ── */}
                            {(selectedAsset.plate_number || selectedAsset.chassis_number || selectedAsset.engine_number ||
                                selectedAsset.serial_number || selectedAsset.quantity || extraKeys.length > 0) && (
                                    <div className="rounded-xl border border-violet-500/20 overflow-hidden">
                                        <SectionHeader icon={Edit2} label="Specifications & Identifiers" color="text-violet-500" bg="bg-violet-500/5" border="border-violet-500/20" />
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <Field label="Plate Number" value={selectedAsset.plate_number} />
                                            <Field label="Chassis Number" value={selectedAsset.chassis_number} />
                                            <Field label="Engine Number" value={selectedAsset.engine_number} />
                                            <Field label="Serial Number" value={selectedAsset.serial_number} />
                                            <Field label="Quantity" value={selectedAsset.quantity} />
                                            {extraKeys.map(key => (
                                                <Field
                                                    key={key}
                                                    label={key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                    value={String(selectedAsset[key])}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* ── Section 3: Location & Ownership ── */}
                            <div className="rounded-xl border border-cyan-500/20 overflow-hidden">
                                <SectionHeader icon={History} label="Location & Ownership" color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-500/5" border="border-cyan-500/20" />
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <Field label="Location" value={selectedAsset.location} />
                                    <Field label="Owner Division" value={selectedAsset.owner_division} />
                                    <Field label="Room No." value={selectedAsset.room_no} />
                                    <Field label="Room Name" value={selectedAsset.room_name} />
                                    <Field label="Custodian Name" value={selectedAsset.custodian_name} />
                                    <Field label="Custodian ID" value={selectedAsset.custodian_id} />
                                    <Field label="Custodian Address" value={selectedAsset.custodian_address} span />
                                    <Field label="Custodian Mobile" value={selectedAsset.custodian_mobile} />
                                    {selectedAsset.assigned_to && <Field label="Assigned To" value={selectedAsset.assigned_to} span />}
                                </div>
                            </div>

                            {/* ── Section 4: Financial Info ── */}
                            <div className="rounded-xl border border-primary/20 overflow-hidden">
                                <SectionHeader icon={Printer} label="Financial Info" color="text-primary" bg="bg-primary/5" border="border-primary/20" />
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <Field label="Purchase Cost" value={`GHS ${Number(selectedAsset.purchase_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                                    <Field label="Purchase Date" value={selectedAsset.purchase_date} />
                                    <Field label="Useful Life" value={selectedAsset.useful_life ? `${selectedAsset.useful_life} Years` : null} />
                                    <Field label="Warranty Expiry" value={selectedAsset.warranty_expiry} />
                                    {depr.isDepreciable && (
                                        <>
                                            <Field label="Accumulated Depreciation" value={`GHS ${depr.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                            <Field label="Current Book Value" value={`GHS ${depr.currentBookValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                            {totalMaintCost > 0 && (
                                                <>
                                                    <Field label="Total Maintenance Spend" value={`+ GHS ${totalMaintCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                                                    <Field label="Adjusted Asset Value" value={`GHS ${adjustedBookValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                {selectedAsset.notes && (
                                    <div className="px-4 pb-4">
                                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest block mb-1">Additional Notes</span>
                                        <p className="text-sm text-text-secondary whitespace-pre-wrap bg-bg-hover/30 rounded-lg p-3 border border-border-color">{selectedAsset.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Section 5: Parts Maintained & Cost ── */}
                            <div className="rounded-xl border border-amber-500/20 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/20">
                                    <div className="flex items-center gap-2">
                                        <Wrench size={13} className="text-amber-500" />
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">Parts Maintained & Costs</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${assetMaintenance.length > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-bg-hover text-text-muted'}`}>
                                        {assetMaintenance.length} Records
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-border-color bg-bg-hover/20">
                                                <th className="py-2 px-3 font-bold text-text-muted uppercase tracking-wider">Date</th>
                                                <th className="py-2 px-3 font-bold text-text-muted uppercase tracking-wider">Check Type</th>
                                                <th className="py-2 px-3 font-bold text-text-muted uppercase tracking-wider">Parts Maintained</th>
                                                <th className="py-2 px-3 font-bold text-text-muted uppercase tracking-wider">Provider</th>
                                                <th className="py-2 px-3 font-bold text-text-muted uppercase tracking-wider text-right">Cost (GHS)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-color/50">
                                            {assetMaintenance.length > 0 ? assetMaintenance.map((task, i) => (
                                                <tr key={i} className="hover:bg-bg-hover/30 transition-colors">
                                                    <td className="py-2 px-3 text-text-secondary">{task.scheduled_date || task.completed_date || '—'}</td>
                                                    <td className="py-2 px-3">
                                                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">{task.routine_check || task.task_type || 'Routine'}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-text-primary max-w-[160px]">
                                                        {task.parts_maintained
                                                            ? <div className="flex flex-wrap gap-1">{task.parts_maintained.split(',').map((p, pi) => <span key={pi} className="px-1.5 py-0.5 rounded bg-bg-hover border border-border-color text-text-secondary text-[10px]">{p.trim()}</span>)}</div>
                                                            : <span className="text-text-muted italic">Not specified</span>}
                                                    </td>
                                                    <td className="py-2 px-3 text-text-muted">{task.service_provider || task.workshop || '—'}</td>
                                                    <td className="py-2 px-3 text-right font-bold text-amber-600">
                                                        {task.service_cost || task.actual_cost ? Number(task.service_cost || task.actual_cost).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" className="py-8 text-center text-text-muted italic">No maintenance records found for this asset.</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-border-color bg-bg-hover/20">
                                                <td colSpan="4" className="py-2 px-3 font-bold text-text-secondary uppercase text-[10px] tracking-widest text-right">Total Service Cost</td>
                                                <td className="py-2 px-3 text-right font-bold text-success text-xs">
                                                    GHS {totalMaintCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* ── Footer Actions ── */}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={() => handlePrint(selectedAsset)}
                                    className="px-4 py-2 bg-bg-hover text-text-primary border border-border-color rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-bg-card transition-colors"
                                >
                                    <Printer size={15} /> Print Details
                                </button>
                                <div className="flex gap-2">
                                    {permissions.canTransferAssets(user) && (
                                        <button
                                            onClick={() => { setIsDetailModalOpen(false); setIsTransferModalOpen(true); }}
                                            className="px-4 py-2 bg-bg-hover text-text-primary border border-border-color rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-bg-card transition-colors"
                                        >
                                            <ArrowRightLeft size={15} /> Transfer
                                        </button>
                                    )}
                                    {permissions.canEditAsset(user) && (
                                        <button
                                            onClick={() => { setIsDetailModalOpen(false); setIsAddModalOpen(true); }}
                                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors"
                                        >
                                            <Edit2 size={15} /> Edit Asset
                                        </button>
                                    )}
                                    <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-text-secondary/10 text-text-secondary rounded-lg text-sm font-bold hover:bg-text-secondary/20 transition-colors">Close</button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>


            {/* Asset History Modal */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Asset History: ${selectedAsset?.name || ''}`}>
                <div className="space-y-4">
                    {loadingHistory ? (
                        <div className="py-12 text-center text-text-muted font-medium">Loading history...</div>
                    ) : assetHistory.length === 0 ? (
                        <div className="py-12 text-center text-text-muted italic border-2 border-dashed border-border-color rounded-xl">
                            No history records found for this asset.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {assetHistory.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-border-color bg-bg-hover/20 hover:bg-bg-hover/40 transition-all flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <History size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-text-primary text-sm">{item.action}</h4>
                                            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{new Date(item.performed_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                                            {item.description}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary uppercase">
                                                {item.performed_by_name?.charAt(0) || 'U'}
                                            </div>
                                            PERFORMED BY: {item.performed_by_name?.toUpperCase() || 'UNKNOWN USER'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setIsHistoryModalOpen(false)} className="px-5 py-2.5 bg-text-secondary/10 text-text-secondary hover:bg-text-secondary/20 rounded-xl text-sm font-bold transition-all">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
            <TransferAssetModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                asset={selectedAsset}
            />
            {/* Disposal Reason Modal */}
            <AnimatePresence>
                {disposeModal.open && (
                    <DisposeReasonModal
                        isOpen={disposeModal.open}
                        assetCount={disposeModal.mode === 'bulk' ? selectedIds.length : 1}
                        onConfirm={handleDisposeConfirm}
                        onCancel={() => setDisposeModal({ open: false, mode: null })}
                    />
                )}
            </AnimatePresence>

            {/* Image Zoom Lightbox Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setZoomedImage(null)}
                        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out select-none"
                    >
                        {/* Close Control */}
                        <div className="absolute top-6 right-6 flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setZoomedImage(null)}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20 shadow-lg cursor-pointer"
                                title="Close preview (ESC)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Asset Info Header Overlay */}
                        <div className="absolute top-6 left-6 max-w-md z-10 pointer-events-none">
                            <span className="text-xs font-mono font-bold text-primary bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-primary/30">
                                {zoomedImage.id}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1.5 shadow-sm drop-shadow">
                                {zoomedImage.title}
                            </h3>
                        </div>

                        {/* Main Enlarged Image Box */}
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/15 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={zoomedImage.src}
                                alt={zoomedImage.title}
                                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl bg-black/40"
                            />
                        </motion.div>

                        <p className="text-white/60 text-xs mt-4 font-medium tracking-wide">
                            Click anywhere outside to close preview
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssetInventory;
