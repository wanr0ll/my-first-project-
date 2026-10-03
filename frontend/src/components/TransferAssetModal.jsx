import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, MapPin, Users, Info, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';
import { useAssets } from '../context/AssetContext';
import { getDefaultImage } from '../utils/assetImages';
import { motion } from 'framer-motion';

const DIVISIONS = [
    'Legal Services', 'HR', 'Finance', 'Public Affairs', 'Training & Dev',
    'MIS', 'Contracts', 'Survey & Design', 'Materials', 'Bridges',
    'Planning', 'Safety & Environment', 'Quantity Surveying',
    'Road Maintenance', 'Plant & Equipment', 'Audit'
];

const TRANSFER_REASONS = [
    'Staff Relocation',
    'Departmental Restructuring',
    'Project Reassignment',
    'Upgrade / Replacement',
    'Routine Redistribution',
    'Other'
];

const TransferAssetModal = ({ isOpen, onClose, asset }) => {
    const { transferAsset } = useAssets();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const [formData, setFormData] = useState({
        division: '',
        location: '',
        custodian_name: '',
        custodian_id: '',
        room_name: '',
        room_number: '',
        transfer_reason: '',
        notes: ''
    });

    useEffect(() => {
        if (asset && isOpen) {
            setFormData({
                division: '',
                location: '',
                custodian_name: '',
                custodian_id: '',
                room_name: '',
                room_number: '',
                transfer_reason: '',
                notes: ''
            });
            setDone(false);
        }
    }, [asset, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = () => {
        setDone(false);
        onClose();
    };

    const hasChanged =
        (formData.division && formData.division !== asset?.division) ||
        (formData.location && formData.location !== asset?.location) ||
        (formData.custodian_name && formData.custodian_name !== asset?.custodian_name) ||
        (formData.room_name && formData.room_name !== asset?.room_name) ||
        (formData.room_number && formData.room_number !== asset?.room_number);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!hasChanged) {
            addToast('Please change at least one detail (Division, Location, or Custodian)', 'warning');
            return;
        }
        if (!formData.notes.trim()) {
            addToast('Please provide a transfer reason or comment', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await transferAsset({
                id: asset.id,
                ...formData
            });
            if (result.success) {
                setDone(true);
            }
        } catch (error) {
            console.error('Transfer error:', error);
            addToast('An unexpected error occurred during transfer', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!asset) return null;

    // Resolve asset image
    const assetImageSrc = asset.image || asset.photo || getDefaultImage(asset);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Asset">
            {done ? (
                /* ── Success State ─────────────────────────────── */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center gap-4 text-center px-6"
                >
                    <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center">
                        <CheckCircle size={44} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Transfer Successful</h3>
                    <p className="text-sm text-text-muted max-w-xs">
                        <span className="font-bold text-text-primary">{asset.name}</span> has been transferred to{' '}
                        <span className="font-bold text-primary">{formData.division}</span>.
                    </p>
                    <div className="w-full mt-2 p-4 glass-panel rounded-xl text-left space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-text-muted font-medium">New Division</span>
                            <span className="font-bold text-text-primary">{formData.division}</span>
                        </div>
                        {formData.location && (
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted font-medium">New Location</span>
                                <span className="font-bold text-text-primary">{formData.location}</span>
                            </div>
                        )}
                        {formData.custodian_name && (
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted font-medium">New Custodian</span>
                                <span className="font-bold text-text-primary">{formData.custodian_name}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={handleClose} className="btn-primary mt-4 px-8">Done</button>
                </motion.div>
            ) : (
                /* ── Form State ──────────────────────────────────── */
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Asset Identity Card */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-bg-hover flex-shrink-0 border border-border-color shadow-sm">
                            <img
                                src={assetImageSrc}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-text-primary text-base truncate">{asset.name}</h3>
                            <p className="text-xs text-text-muted font-mono mt-0.5 tracking-wider uppercase">{asset.asset_id || asset.id}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                <span className="text-[10px] font-bold bg-bg-hover text-text-muted px-2 py-0.5 rounded-full border border-border-color">{asset.category || asset.major_category}</span>
                                <span className="text-[10px] font-bold bg-bg-hover text-text-muted px-2 py-0.5 rounded-full border border-border-color">{asset.division}</span>
                            </div>
                        </div>
                    </div>

                    {/* Change indicator */}
                    {!hasChanged && (
                        <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 border border-warning/20 rounded-xl px-4 py-3">
                            <AlertCircle size={14} className="shrink-0" />
                            Change at least one field below to enable the transfer.
                        </div>
                    )}

                    {/* ── Current → New Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current (read-only) */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                <Building2 size={12} /> Current Assignment
                            </h4>
                            <div className="p-4 rounded-xl border border-border-color bg-bg-hover/20 space-y-3 opacity-75">
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold">Division & Location</label>
                                    <p className="text-sm font-bold text-text-secondary mt-0.5">
                                        {asset.division || '—'} {asset.location ? `• ${asset.location}` : ''}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold">Current Custodian</label>
                                    <p className="text-sm font-bold text-text-secondary mt-0.5">
                                        {asset.custodian_name || '—'}
                                        {asset.custodian_id && <span className="text-xs text-text-muted ml-2 font-mono">({asset.custodian_id})</span>}
                                    </p>
                                </div>
                                {(asset.room_name || asset.room_number) && (
                                    <div>
                                        <label className="text-[10px] text-text-muted uppercase font-bold">Room</label>
                                        <p className="text-sm font-bold text-text-secondary mt-0.5">
                                            {asset.room_name || ''} {asset.room_number ? `#${asset.room_number}` : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Values */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <ArrowRightLeft size={12} /> Transfer To
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="label">New Division</label>
                                    <select
                                        name="division"
                                        value={formData.division}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="">— Select Division —</option>
                                        {DIVISIONS.map(div => (
                                            <option key={div} value={div}>{div}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">New Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="input-field pl-9"
                                            placeholder="Physical location or office"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custodian Section */}
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 space-y-4">
                        <div className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={12} /> New Custodian Assignment
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Custodian Name</label>
                                <input
                                    name="custodian_name"
                                    value={formData.custodian_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="label">Staff ID</label>
                                <input
                                    name="custodian_id"
                                    value={formData.custodian_id}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Employee ID"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label">Room Name (Optional)</label>
                                <input
                                    name="room_name"
                                    value={formData.room_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. Server Room A"
                                />
                            </div>
                            <div>
                                <label className="label">Room Number (Optional)</label>
                                <input
                                    name="room_number"
                                    value={formData.room_number}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. 104"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reason + Notes */}
                    <div className="space-y-4">
                        <div>
                            <label className="label">Transfer Reason</label>
                            <select
                                name="transfer_reason"
                                value={formData.transfer_reason}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="">— Select a reason —</option>
                                {TRANSFER_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label flex items-center gap-2">
                                <Info size={13} className="text-primary" /> Additional Comments *
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="input-field h-24 resize-none"
                                placeholder="Provide more details about this transfer..."
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3 border-t border-border-color">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                            disabled={loading || !hasChanged}
                        >
                            {loading ? 'Processing Transfer...' : (
                                <><ArrowRightLeft size={16} /> Complete Transfer</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default TransferAssetModal;
