import React, { useState } from 'react';
import { ArrowRightLeft, MapPin, Users, Info, Package, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';
import { useAssets } from '../context/AssetContext';
import { motion } from 'framer-motion';

const DIVISIONS = [
    'Legal Services', 'HR', 'Finance', 'Public Affairs', 'Training & Dev',
    'MIS', 'Contracts', 'Survey & Design', 'Materials', 'Bridges',
    'Planning', 'Safety & Environment', 'Quantity Surveying',
    'Road Maintenance', 'Plant & Equipment', 'Audit'
];

const BulkTransferModal = ({ isOpen, onClose, assets = [] }) => {
    const { transferAsset } = useAssets();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);

    const [formData, setFormData] = useState({
        division: '',
        location: '',
        custodian_name: '',
        custodian_id: '',
        room_name: '',
        room_number: '',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = () => {
        setProgress(0);
        setDone(false);
        setFormData({ division: '', location: '', custodian_name: '', custodian_id: '', room_name: '', room_number: '', notes: '' });
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.division) { addToast('Please select a destination division', 'warning'); return; }
        if (!formData.notes.trim()) { addToast('Please provide a transfer reason', 'warning'); return; }

        setLoading(true);
        setProgress(0);
        let successCount = 0;

        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            try {
                const res = await transferAsset({ id: asset.id, ...formData });
                if (res?.success) successCount++;
            } catch (err) {
                console.error(`Failed transfer for asset ${asset.id}:`, err);
            }
            setProgress(Math.round(((i + 1) / assets.length) * 100));
        }

        setLoading(false);
        setDone(true);
        addToast(`${successCount} of ${assets.length} assets transferred successfully`, 'success');
    };

    if (!assets || assets.length === 0) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Bulk Transfer · ${assets.length} Assets`}>
            {done ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center gap-4 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center">
                        <CheckCircle size={36} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Transfer Complete</h3>
                    <p className="text-sm text-text-muted">
                        All {assets.length} selected assets have been transferred to <span className="font-bold text-text-primary">{formData.division}</span>.
                    </p>
                    <button onClick={handleClose} className="btn-primary mt-4">Done</button>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selected Assets Preview */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Package size={12} /> {assets.length} Assets Selected for Transfer
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                            {assets.map(a => (
                                <span
                                    key={a.id}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bg-card border border-border-color text-text-secondary px-2.5 py-1 rounded-full"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                    {a.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Destination Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Destination</h4>
                            <div>
                                <label className="label">New Division *</label>
                                <select
                                    name="division"
                                    value={formData.division}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                >
                                    <option value="">— Select Division —</option>
                                    {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
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
                                        className="input-field pl-10"
                                        placeholder="Enter new physical location"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={12} /> New Custodian (Optional)
                            </h4>
                            <div>
                                <label className="label">Custodian Name</label>
                                <input
                                    name="custodian_name"
                                    value={formData.custodian_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="label">Staff ID</label>
                                <input
                                    name="custodian_id"
                                    value={formData.custodian_id}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Enter employee ID"
                                />
                            </div>
                            <div>
                                <label className="label">Room Name</label>
                                <input
                                    name="room_name"
                                    value={formData.room_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. Storage Room"
                                />
                            </div>
                            <div>
                                <label className="label">Room Number</label>
                                <input
                                    name="room_number"
                                    value={formData.room_number}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. 101"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transfer Reason */}
                    <div className="space-y-2">
                        <label className="label flex items-center gap-2">
                            <Info size={14} className="text-primary" /> Transfer Reason *
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input-field h-24 resize-none"
                            placeholder="Why are these assets being transferred? e.g. Departmental restructuring, project reassignment..."
                            required
                        />
                    </div>

                    {/* Progress Bar (shown during submission) */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-text-muted">
                                <span>Transferring assets...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-bg-hover overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
                            {loading
                                ? `Transferring ${assets.length} assets...`
                                : <><ArrowRightLeft size={16} /> Transfer {assets.length} Assets</>
                            }
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default BulkTransferModal;
