import React, { useState, useRef } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle, Filter, Plus, ScanLine, Camera, Upload, X, Eye, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMaintenanceTasks } from '../context/MaintenanceContext';
import { useAssets } from '../context/AssetContext';
import { uploadMaintenanceReceipt } from '../services/api';

const StatusBadge = ({ status }) => {
    let colorClass = "";
    let icon = null;

    switch (status.toLowerCase()) {
        case 'completed':
            colorClass = "badge-success";
            icon = <CheckCircle size={12} />;
            break;
        case 'in progress':
            colorClass = "badge-warning";
            icon = <Clock size={12} />;
            break;
        case 'scheduled':
            colorClass = "badge-info";
            icon = <Calendar size={12} />;
            break;
        case 'overdue':
            colorClass = "badge-danger";
            icon = <AlertTriangle size={12} />;
            break;
        default:
            colorClass = "badge-neutral";
    }

    return (
        <span className={`badge ${colorClass} flex items-center gap-1.5`}>
            {icon} {status}
        </span>
    );
};

const MaintenanceSchedule = () => {
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // Receipt scanner state
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [receiptUploading, setReceiptUploading] = useState(false);
    const [receiptUploaded, setReceiptUploaded] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const receiptInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const { addToast } = useToast();
    const { user, permissions } = useAuth();
    const { addNotification } = useNotifications();
    const { maintenanceTasks, addMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask } = useMaintenanceTasks();
    const { assets, updateAsset } = useAssets();

    const approvedAssets = (assets || []).filter(a => a.approval_status === 'Approved');
    const maintenanceTargetAssets = approvedAssets.filter(a =>
        a.status === 'Maintenance' || a.status === 'Faulty' || a.status === 'Under Maintenance'
    );

    // Form State
    const [formData, setFormData] = useState({
        asset_id: '',
        type: 'Routine Check',
        date: '',
        priority: 'Medium',
        serviceProvider: '',
        estimatedCost: '',
        partsNeeded: '',
        technicianContact: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReceiptFile = (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowed.includes(file.type)) {
            addToast('Only JPG, PNG, or PDF files are allowed.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            addToast('File size must be under 10MB.', 'error');
            return;
        }
        setReceiptFile(file);
        setReceiptUploaded(false);
        if (file.type === 'application/pdf') {
            setReceiptPreview('pdf');
        } else {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleReceiptDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleReceiptFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedAssetObj = approvedAssets.find(a => a.id === formData.asset_id);
        if (!selectedAssetObj) {
            addToast('Please select a valid asset', 'error');
            return;
        }

        // Create new maintenance task for the backend
        const newTask = {
            asset_id: formData.asset_id,
            asset_type: selectedAssetObj.asset_type || selectedAssetObj.category || 'General',
            description: formData.type,
            task_type: formData.type,
            priority: formData.priority,
            status: 'Scheduled',
            scheduled_date: formData.date,
            // assigned_to has a foreign key to users.id. 
            // If serviceProvider is text, it will fail.
            assigned_to: null,
            estimated_cost: parseFloat(formData.estimatedCost) || 0,
            parts_maintained: formData.partsNeeded,
            notes: `Provider: ${formData.serviceProvider || 'Pending'}. ${formData.partsNeeded ? 'Parts: ' + formData.partsNeeded : ''}`
        };

        const result = await addMaintenanceTask(newTask);
        if (result.success) {
            // Upload receipt if one is provided
            if (receiptFile) {
                try {
                    setReceiptUploading(true);
                    await uploadMaintenanceReceipt(result.id, receiptFile);
                } catch (err) {
                    addToast('Task created, but receipt upload failed: ' + err.message, 'warning');
                } finally {
                    setReceiptUploading(false);
                }
            }

            // Update asset status to 'Under Maintenance'
            await updateAsset({
                id: formData.asset_id,
                status: 'Under Maintenance',
                category: selectedAssetObj.category
            });

            addToast(`Scheduled maintenance for: ${selectedAssetObj.name}`, 'success');
            addNotification({
                type: 'warning',
                title: 'Maintenance Task Assigned',
                message: `A new ${formData.type} job for ${selectedAssetObj.name} has been added to the schedule.`,
                link: '/maintenance'
            });
            setIsModalOpen(false);
            setFormData({ asset_id: '', type: 'Routine Check', date: '', priority: 'Medium', serviceProvider: '', estimatedCost: '', partsNeeded: '', technicianContact: '' });
            setReceiptFile(null);
            setReceiptPreview(null);
            setReceiptUploaded(false);
            setReceiptUrl('');
        }
    };

    // Combine real tasks with virtual tasks from assets marked "Under Maintenance"
    const virtualTasks = (assets || [])
        .filter(a => a.status === 'Under Maintenance' || a.status === 'Maintenance')
        .map(a => ({
            id: `INV-${a.id}`,
            asset: a.name,
            asset_id: a.id,
            type: 'Inventory Sync',
            status: 'In Progress',
            date: new Date().toISOString().split('T')[0],
            priority: 'Medium',
            assignedTo: 'In-House Tech',
            isVirtual: true
        }));

    // Deduplicate: If an asset has a real task and is also "Under Maintenance", show the real one
    const displayTasks = [...maintenanceTasks];
    virtualTasks.forEach(vt => {
        const exists = displayTasks.find(dt => dt.asset_id === vt.asset_id || dt.asset === vt.asset);
        if (!exists) {
            displayTasks.push(vt);
        }
    });

    // Dynamic Status Helper to handle 'Overdue'
    const getEffectiveStatus = (task) => {
        if (task.status === 'Completed' || task.status === 'Cancelled') return task.status;

        const taskDate = new Date(task.date || task.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (taskDate < today) return 'Overdue';
        return task.status;
    };

    const displayTasksWithEffectiveStatus = displayTasks.map(t => ({
        ...t,
        effectiveStatus: getEffectiveStatus(t)
    }));

    const filteredTasks = filter === 'All'
        ? displayTasksWithEffectiveStatus
        : displayTasksWithEffectiveStatus.filter(task => task.effectiveStatus === filter);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary text-glow">Maintenance Schedule</h1>
                    <p className="text-text-muted mt-2 font-medium">Track and manage maintenance tasks for Head Office vehicles, electronics, and devices.</p>
                </div>
                {permissions.canAssignTasks(user) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/20 w-full md:w-auto whitespace-nowrap mt-4 md:mt-0"
                    >
                        <Plus size={16} /> Schedule Maintenance
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {['All', 'Scheduled', 'In Progress', 'Completed', 'Overdue'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`whitespace-nowrap shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${filter === status
                            ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                            : 'bg-bg-card border-border-color text-text-muted hover:text-text-primary hover:border-accent'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredTasks.length === 0 ? (
                    <div className="glass-panel p-12 rounded-xl text-center">
                        <Calendar size={32} className="text-text-muted/40 mx-auto mb-3" />
                        <p className="text-text-muted font-medium">No maintenance tasks in this category</p>
                        <p className="text-text-muted/60 text-xs mt-1">Try switching filters or schedule a new task</p>
                    </div>
                ) : filteredTasks.map((task, index) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-panel p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-[hsl(var(--bg-hover))] transition-colors ${task.isVirtual ? 'border-l-4 border-l-warning' : ''}`}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Job #{task.id}</span>
                                <StatusBadge status={task.effectiveStatus} />
                                {task.priority === 'Critical' && (
                                    <span className="badge badge-danger border-none shadow-danger/20">
                                        Critical Alert
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors mb-1 truncate">{task.asset}</h3>
                            <p className="text-text-secondary text-sm font-medium">{task.type} <span className="mx-1 opacity-30">|</span> Tech: <span className="text-text-primary">{task.assignedTo}</span></p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2 bg-bg-dark/50 px-3 py-2 rounded-xl border border-white/5 text-text-muted font-bold text-xs uppercase tracking-tighter shadow-inner">
                                <Calendar size={13} className="text-accent" />
                                <span>{task.date}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedTask(task);
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                    setReceiptUploaded(!!task.receipt_url);
                                    setReceiptUrl(task.receipt_url || '');
                                    setIsDetailModalOpen(true);
                                }}
                                className="text-text-muted hover:text-text-primary font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                View →
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Schedule Maintenance Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Maintenance">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[hsl(var(--text-secondary))] mb-1">Target Asset</label>
                        <select
                            name="asset_id"
                            value={formData.asset_id}
                            onChange={handleInputChange}
                            className="w-full bg-bg-hover border border-border-color rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none"
                            required
                        >
                            <option value="">Select Asset...</option>
                            {maintenanceTargetAssets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.id}) - {asset.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Maintenance Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full bg-bg-hover border border-border-color rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none"
                        >
                            <option>Routine Check</option>
                            <option>Vehicle Servicing</option>
                            <option>AC Cleaning/Refill</option>
                            <option>IT Support/Repair</option>
                            <option>Office Maintenance</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Scheduled Date</label>
                        <input
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            type="date"
                            className="w-full bg-bg-hover border border-border-color rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Service Provider / Workshop</label>
                            <input
                                name="serviceProvider"
                                value={formData.serviceProvider}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="GHA Garage / External workshop"
                            />
                        </div>
                        <div>
                            <label className="label">Estimated Cost (GHS)</label>
                            <input
                                name="estimatedCost"
                                type="number"
                                value={formData.estimatedCost}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Parts to be Replaced / Needed</label>
                        <input
                            name="partsNeeded"
                            value={formData.partsNeeded}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="e.g., Brake pads, Engine oil, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-3 ml-1">Priority Level</label>
                        <div className="flex flex-wrap gap-4">
                            {['Low', 'Medium', 'High', 'Critical'].map(level => (
                                <label key={level} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="priority"
                                        value={level}
                                        checked={formData.priority === level}
                                        onChange={handleInputChange}
                                        className="accent-primary h-4 w-4"
                                    />
                                    <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Receipt Scanner UI */}
                    <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                                <ScanLine size={12} />
                                Maintenance Receipt
                            </div>
                            {(receiptFile || receiptUploaded) && (
                                <button
                                    type="button"
                                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); setReceiptUploaded(false); setReceiptUrl(''); }}
                                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <X size={10} /> Remove
                                </button>
                            )}
                        </div>

                        <input
                            ref={receiptInputRef}
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => handleReceiptFile(e.target.files[0])}
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleReceiptFile(e.target.files[0])}
                        />

                        {(!receiptFile && !receiptUploaded) ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleReceiptDrop}
                                className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                                    isDragOver
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-violet-300/40 bg-violet-500/3 hover:border-violet-400/60'
                                }`}
                            >
                                <ScanLine size={20} className="text-violet-500 mb-1" />
                                <div className="text-center">
                                    <p className="text-xs font-bold text-text-primary">Scan Receipt</p>
                                    <p className="text-[10px] text-text-muted mt-0.5">JPG, PNG, PDF (Max 10MB)</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-colors flex items-center gap-1.5"
                                    >
                                        <Camera size={12} /> Camera
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => receiptInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-bg-card border border-violet-300/40 text-text-primary text-[10px] font-bold hover:border-violet-400/80 transition-colors flex items-center gap-1.5"
                                    >
                                        <Upload size={12} /> Browse
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3 items-start p-3 rounded-lg bg-bg-card border border-border-color/50">
                                <div className="shrink-0 w-16 h-20 rounded-md overflow-hidden bg-violet-500/10 border border-violet-300/30 flex items-center justify-center">
                                    {receiptPreview === 'pdf' || (receiptUrl && receiptUrl.endsWith('.pdf')) ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <FileText size={20} className="text-violet-500" />
                                            <span className="text-[8px] font-bold text-violet-600 uppercase">PDF</span>
                                        </div>
                                    ) : (
                                        <img src={receiptPreview || receiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {receiptUploaded ? (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-extrabold uppercase">
                                                <CheckCircle size={10} /> Uploaded
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 text-[9px] font-extrabold uppercase">
                                                <ScanLine size={10} /> Ready
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-text-primary mt-1 truncate">
                                        {receiptFile ? receiptFile.name : 'Receipt Attached'}
                                    </p>
                                    
                                    {receiptUploaded && receiptUrl && (
                                        <a
                                            href={receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-1 text-[10px] text-violet-600 hover:text-violet-700 font-semibold"
                                        >
                                            <Eye size={10} /> View Receipt
                                        </a>
                                    )}
                                    
                                    {receiptUploading && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-border-color rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-500 rounded-full animate-pulse w-3/4" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(!receiptUploaded && receiptFile) && (
                                        <p className="text-[9px] text-text-muted mt-2">
                                            Will be uploaded when task is saved.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-primary transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Confirm Schedule
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Task Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    setReceiptUploaded(false);
                    setReceiptUrl('');
                }}
                title={`Maintenance Profile: ${selectedTask?.asset}`}
            >
                {selectedTask && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Status</p>
                                <StatusBadge status={selectedTask.effectiveStatus || selectedTask.status} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Task ID</p>
                                <p className="text-sm font-mono text-text-primary px-2 py-0.5 bg-white/5 rounded">#{selectedTask.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Assigned Technician / Provider</p>
                                <p className="text-sm font-semibold text-text-primary">{selectedTask.assignedTo || selectedTask.serviceProvider || 'Pending'}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Scheduled Date</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <Calendar size={14} className="text-accent" />
                                    {selectedTask.date}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Financial & Material Summary</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase">Cost (Est/Act)</p>
                                    <p className="text-sm font-bold text-text-primary">GHS {parseFloat(selectedTask.actual_cost || selectedTask.estimated_cost || selectedTask.estimatedCost || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase">Parts Replaced / Needed</p>
                                    <p className="text-sm font-bold text-text-primary">{selectedTask.parts_maintained || selectedTask.partsNeeded || 'None listed'}</p>
                                </div>
                            </div>
                        </div>

                        {selectedTask.status === 'Completed' ? (
                            <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                                <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-2">Maintenance Post-Mortem</p>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {selectedTask.outcome || "Maintenance successfully completed. Component health restored to 'Good' according to GHA Technical Division standard."}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-bg-hover/50 border border-border-color">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Technician's Instructions</p>
                                <p className="text-xs text-text-secondary">Perform standard ${selectedTask.type} protocol for ${selectedTask.asset}. Ensure all receipts are kept for GHA audit compliance.</p>
                            </div>
                        )}

                        {/* Receipt Scanner UI */}
                        {(!selectedTask.isVirtual && !selectedTask.id?.toString().startsWith('INV-')) && (
                            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <ScanLine size={12} />
                                        Maintenance Receipt
                                    </div>
                                    {(receiptFile || receiptUploaded) && (
                                        <button
                                            type="button"
                                            onClick={() => { setReceiptFile(null); setReceiptPreview(null); setReceiptUploaded(false); setReceiptUrl(''); }}
                                            className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <X size={10} /> Remove
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={receiptInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf"
                                    className="hidden"
                                    onChange={(e) => handleReceiptFile(e.target.files[0])}
                                />
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => handleReceiptFile(e.target.files[0])}
                                />

                                {(!receiptFile && !receiptUploaded) ? (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={handleReceiptDrop}
                                        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                                            isDragOver
                                                ? 'border-violet-500 bg-violet-500/10'
                                                : 'border-violet-300/40 bg-violet-500/3 hover:border-violet-400/60'
                                        }`}
                                    >
                                        <ScanLine size={20} className="text-violet-500 mb-1" />
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-text-primary">Scan Receipt</p>
                                            <p className="text-[10px] text-text-muted mt-0.5">JPG, PNG, PDF (Max 10MB)</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-colors flex items-center gap-1.5"
                                            >
                                                <Camera size={12} /> Camera
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => receiptInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-lg bg-bg-card border border-violet-300/40 text-text-primary text-[10px] font-bold hover:border-violet-400/80 transition-colors flex items-center gap-1.5"
                                            >
                                                <Upload size={12} /> Browse
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 items-start p-3 rounded-lg bg-bg-card border border-border-color/50">
                                        <div className="shrink-0 w-16 h-20 rounded-md overflow-hidden bg-violet-500/10 border border-violet-300/30 flex items-center justify-center">
                                            {receiptPreview === 'pdf' || (receiptUrl && receiptUrl.endsWith('.pdf')) ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <FileText size={20} className="text-violet-500" />
                                                    <span className="text-[8px] font-bold text-violet-600 uppercase">PDF</span>
                                                </div>
                                            ) : (
                                                <img src={receiptPreview || receiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {receiptUploaded ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-extrabold uppercase">
                                                        <CheckCircle size={10} /> Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 text-[9px] font-extrabold uppercase">
                                                        <ScanLine size={10} /> Ready
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-text-primary mt-1 truncate">
                                                {receiptFile ? receiptFile.name : 'Receipt Attached'}
                                            </p>
                                            
                                            {receiptUploaded && receiptUrl && (
                                                <a
                                                    href={receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-violet-600 hover:text-violet-700 font-semibold"
                                                >
                                                    <Eye size={10} /> View Receipt
                                                </a>
                                            )}
                                            
                                            {receiptUploading && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <div className="h-1 flex-1 bg-border-color rounded-full overflow-hidden">
                                                        <div className="h-full bg-violet-500 rounded-full animate-pulse w-3/4" />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {(!receiptUploaded && receiptFile) && (
                                                <p className="text-[9px] text-text-muted mt-2">
                                                    Change status to trigger upload.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-2 flex justify-between items-center border-t border-white/5 mt-4">
                            <div className="flex gap-3">
                                {permissions.canAssignTasks(user) ? (
                                    <select
                                        value={selectedTask.status}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            let success = false;
                                            let completionData = {};

                                            if (newStatus === 'Completed') {
                                                const parts = window.prompt("Enter parts maintained/replaced (optional):", selectedTask.parts_maintained || selectedTask.partsNeeded || '');
                                                if (parts === null) return; // cancelled
                                                const cost = window.prompt("Enter actual repair cost (GHS) (optional):", selectedTask.actual_cost || selectedTask.estimated_cost || selectedTask.estimatedCost || 0);
                                                if (cost === null) return; // cancelled

                                                completionData.parts_maintained = parts;
                                                completionData.actual_cost = parseFloat(cost) || 0;
                                            }

                                            // 1. Update Maintenance Task (if not virtual)
                                            if (selectedTask.isVirtual || selectedTask.id?.toString().startsWith('INV-')) {
                                                success = true;
                                            } else {
                                                const result = await updateMaintenanceTask(selectedTask.id, { ...selectedTask, status: newStatus, ...completionData });
                                                success = result.success;
                                            }

                                            if (success) {
                                                // 2. Upload Receipt if staged
                                                if (receiptFile && !receiptUploaded && !selectedTask.isVirtual && !selectedTask.id?.toString().startsWith('INV-')) {
                                                    try {
                                                        setReceiptUploading(true);
                                                        const uploadResult = await uploadMaintenanceReceipt(selectedTask.id, receiptFile);
                                                        if (uploadResult?.data?.receipt_url) {
                                                            setReceiptUrl(uploadResult.data.receipt_url);
                                                            setReceiptUploaded(true);
                                                        }
                                                    } catch (err) {
                                                        addToast('Task saved, but receipt upload failed: ' + err.message, 'warning');
                                                    } finally {
                                                        setReceiptUploading(false);
                                                    }
                                                }

                                                // 3. Sync asset status
                                                let newAssetStatus = null;
                                                if (newStatus === 'Completed') {
                                                    newAssetStatus = 'Active';
                                                } else if (newStatus === 'In Progress') {
                                                    newAssetStatus = 'Under Maintenance';
                                                }

                                                if (newAssetStatus && selectedTask.asset_id) {
                                                    await updateAsset({
                                                        id: selectedTask.asset_id,
                                                        status: newAssetStatus,
                                                        category: selectedTask.asset_type || 'General'
                                                    });
                                                }

                                                addToast(`Status updated to ${newStatus}`, 'success');
                                                setIsDetailModalOpen(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-all border border-primary/20 outline-none cursor-pointer"
                                    >
                                        <option value="Scheduled" className="bg-bg-card text-text-primary">Scheduled</option>
                                        <option value="In Progress" className="bg-bg-card text-text-primary">In Progress</option>
                                        <option value="Completed" className="bg-bg-card text-text-primary">Completed</option>
                                        <option value="Overdue" className="bg-bg-card text-text-primary">Overdue</option>
                                    </select>
                                ) : (
                                    <StatusBadge status={selectedTask.effectiveStatus || selectedTask.status} />
                                )}

                                {permissions.canAssignTasks(user) && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to remove this maintenance task?')) {
                                                const result = await deleteMaintenanceTask(selectedTask.id);
                                                if (result.success) {
                                                    setIsDetailModalOpen(false);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg text-xs font-bold transition-all border border-danger/20"
                                    >
                                        Delete Task
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="btn-primary"
                            >
                                Dismiss View
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};

export default MaintenanceSchedule;
