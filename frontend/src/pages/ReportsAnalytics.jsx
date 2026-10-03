import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    ChevronDown,
    Package,
    DollarSign,
    TrendingUp,
    Database,
    Check,
    Calculator,
    PieChart as PieChartIcon,
    Search,
    Layers,
    Clock
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { calculateDepreciation } from '../utils/depreciation';

const CATEGORY_COLORS = {
    'Land and building': '#10b981',
    'Plant and Machinery': '#f59e0b',
    'Fleets': '#3b82f6',
    'Furniture and office Equipment': '#ef4444',
    'IT and Technical': '#8b5cf6',
    'General': '#14b8a6',
};

const DIVISION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg-card p-3 rounded-xl shadow-xl border border-border-color">
                <p className="font-semibold text-text-primary text-xs mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-text-muted">{entry.name}:</span>
                        <span className="text-text-primary font-bold max-w-[150px] truncate">{
                            typeof entry.value === 'number' && entry.name !== 'value' && entry.name !== 'COUNT' ? `₵${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : entry.value
                        }</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ReportsAnalytics = () => {
    const { assets } = useAssets();

    const approvedAssetsList = useMemo(() => {
        return (assets || []).filter(a => a.approval_status === 'Approved');
    }, [assets]);

    const nonArchivedApprovedAssets = useMemo(() => {
        return approvedAssetsList.filter(a => {
            const s = (a.status || a.Status || '').toString().toLowerCase();
            return s !== 'archived';
        });
    }, [approvedAssetsList]);

    const {
        totalAssets, fixedCount, nonFixedCount,
        totalValue, fixedValue, nonFixedValue,
        bookValue, annualDepreciationValue, accumulatedDepreciationValue,
        activeCount, maintenanceCount, inactiveCount, disposedCount, archivedCount,
        goodCount, fairCount, poorCount, totalApprovedCount
    } = useMemo(() => {
        const approvedNonArchived = nonArchivedApprovedAssets;
        let tAssets = approvedNonArchived.length;
        let fCount = 0, nfCount = 0;
        let tVal = 0, fVal = 0, nfVal = 0;
        let bVal = 0, annDeprVal = 0, accDeprVal = 0;
        let aCount = 0, mCount = 0, iCount = 0, dCount = 0, archCount = 0;
        let pCount = 0, fairC = 0, gCount = 0;

        approvedNonArchived.forEach(asset => {
            const cost = parseFloat(asset.purchase_cost) || 0;
            tVal += cost;

            if (asset.major_category === 'Fixed Asset') {
                fCount++;
                fVal += cost;
                const depr = calculateDepreciation(asset);
                bVal += depr.currentBookValue;
                annDeprVal += depr.annualDepreciation;
                accDeprVal += depr.accumulatedDepreciation;
            } else {
                nfCount++;
                nfVal += cost;
                bVal += cost;
            }
        });

        approvedAssetsList.forEach(asset => {
            const stat = (asset.status || asset.Status || '').toString().toLowerCase();
            const cond = (asset.asset_condition || asset.condition || '').toString().toLowerCase();

            if (stat === 'active') aCount++;
            else if (stat === 'in maintenance' || stat === 'maintenance') mCount++;
            else if (stat === 'inactive') iCount++;
            else if (stat === 'disposed') dCount++;
            else if (stat === 'archived') archCount++;

            if (stat === 'good' || cond === 'good' || cond === 'new' || cond === 'excellent') gCount++;
            else if (stat === 'fair' || cond === 'fair') fairC++;
            else if (stat === 'poor' || cond === 'poor') pCount++;
        });

        return {
            totalAssets: tAssets, fixedCount: fCount, nonFixedCount: nfCount,
            totalValue: tVal, fixedValue: fVal, nonFixedValue: nfVal,
            bookValue: bVal, annualDepreciationValue: annDeprVal, accumulatedDepreciationValue: accDeprVal,
            activeCount: aCount, maintenanceCount: mCount, inactiveCount: iCount, disposedCount: dCount, archivedCount: archCount,
            goodCount: gCount, fairCount: fairC, poorCount: pCount, totalApprovedCount: approvedAssetsList.length
        };
    }, [approvedAssetsList, nonArchivedApprovedAssets]);

    const formatCurrencyM = (val) => {
        if (Math.abs(val) >= 1000000) return `₵${(val / 1000000).toFixed(2)}M`;
        if (Math.abs(val) >= 1000) return `₵${(val / 1000).toFixed(1)}K`;
        return `₵${val.toFixed(2)}`;
    };

    const divisionData = useMemo(() => {
        const counts = {};
        nonArchivedApprovedAssets.forEach(a => {
            const div = a.division || 'Unassigned';
            counts[div] = (counts[div] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
    }, [nonArchivedApprovedAssets]);

    const categoryData = useMemo(() => {
        const categories = {};
        nonArchivedApprovedAssets.forEach(a => {
            const cat = a.category || 'General';
            const cost = parseFloat(a.purchase_cost) || 0;

            if (!categories[cat]) {
                categories[cat] = {
                    name: cat,
                    count: 0,
                    cost: 0,
                    bookValue: 0,
                    annualDepreciation: 0,
                    accumulatedDepreciation: 0
                };
            }
            categories[cat].count++;
            categories[cat].cost += cost;

            if (a.major_category === 'Fixed Asset') {
                const depr = calculateDepreciation(a);
                categories[cat].bookValue += depr.currentBookValue;
                categories[cat].annualDepreciation += depr.annualDepreciation;
                categories[cat].accumulatedDepreciation += depr.accumulatedDepreciation;
            } else {
                categories[cat].bookValue += cost;
            }
        });
        return Object.values(categories).sort((a, b) => b.cost - a.cost);
    }, [nonArchivedApprovedAssets]);

    const totalDivisions = divisionData.length;

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [deprSearch, setDeprSearch] = useState('');

    const exportColumns = ['AIN', 'Asset Name', 'Category', 'Division', 'Custodian', 'Status', 'Cost', 'Annual Depreciation', 'Accumulated Depreciation', 'Book Value'];
    const [selectedCols, setSelectedCols] = useState(exportColumns);

    const filteredExportAssets = useMemo(() => {
        let exportData = nonArchivedApprovedAssets;
        if (selectedCategory) exportData = exportData.filter(a => a.category === selectedCategory);
        if (selectedDivision) exportData = exportData.filter(a => a.division === selectedDivision);
        if (selectedStatus) exportData = exportData.filter(a => (a.status || '').toLowerCase() === selectedStatus.toLowerCase());
        return exportData;
    }, [nonArchivedApprovedAssets, selectedCategory, selectedDivision, selectedStatus]);

    const handleExportCSV = () => {
        if (filteredExportAssets.length === 0 || selectedCols.length === 0) return;

        const colMap = {
            'AIN': 'ain',
            'Asset Name': 'asset_name',
            'Category': 'category',
            'Division': 'division',
            'Custodian': 'custodian',
            'Status': 'status',
            'Cost': 'purchase_cost',
            'Annual Depreciation': 'annual_depreciation_calculated',
            'Accumulated Depreciation': 'accumulated_depreciation_calculated',
            'Book Value': 'book_value_calculated'
        };

        const csvRows = [];
        csvRows.push(selectedCols.map(c => `"${c}"`).join(','));

        filteredExportAssets.forEach(asset => {
            const row = selectedCols.map(col => {
                const key = colMap[col];
                let val = '';
                if (key === 'annual_depreciation_calculated') {
                    if (asset.major_category === 'Fixed Asset') {
                        val = calculateDepreciation(asset).annualDepreciation.toFixed(2);
                    } else {
                        val = '0.00';
                    }
                } else if (key === 'accumulated_depreciation_calculated') {
                    if (asset.major_category === 'Fixed Asset') {
                        val = calculateDepreciation(asset).accumulatedDepreciation.toFixed(2);
                    } else {
                        val = '0.00';
                    }
                } else if (key === 'book_value_calculated') {
                    if (asset.major_category === 'Fixed Asset') {
                        val = calculateDepreciation(asset).currentBookValue.toFixed(2);
                    } else {
                        val = (parseFloat(asset.purchase_cost) || 0).toFixed(2);
                    }
                } else {
                    val = asset[key] || '';
                }

                if (typeof val === 'string') {
                    val = val.replace(/"/g, '""');
                    return `"${val}"`;
                }
                return val;
            });
            csvRows.push(row.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GHA_Assets_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12 min-h-screen"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-[28px] font-bold text-primary tracking-tight">Reports &amp; Analytics</h1>
                    <p className="text-text-muted text-sm">Real-time insights for {totalAssets} assets across {totalDivisions} divisions.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition-colors shrink-0"
                >
                    <Download size={16} /> Export Report
                </button>
            </div>

            {/* Top 5 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1 */}
                <div className="bg-bg-card rounded-2xl p-5 border border-border-color border-l-4 border-l-blue-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Package size={14} />
                        </div>
                        TOTAL ASSETS
                    </div>
                    <div className="text-2xl font-bold text-text-primary mb-1">{totalAssets}</div>
                    <div className="text-[11px] text-text-muted font-medium">{fixedCount} fixed <span className="opacity-50 mx-0.5">•</span> {nonFixedCount} non-fixed</div>
                </div>

                {/* Card 2 */}
                <div className="bg-bg-card rounded-2xl p-5 border border-border-color border-l-4 border-l-orange-400 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                            <DollarSign size={14} />
                        </div>
                        PURCHASE COST
                    </div>
                    <div className="text-2xl font-bold text-text-primary mb-1">{formatCurrencyM(totalValue)}</div>
                    <div className="text-[11px] text-text-muted font-medium">Fixed: {formatCurrencyM(fixedValue)}</div>
                </div>

                {/* Card 3 */}
                <div className="bg-bg-card rounded-2xl p-5 border border-border-color border-l-4 border-l-purple-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                            <Clock size={14} />
                        </div>
                        ANNUAL DEPRECIATION
                    </div>
                    <div className="text-2xl font-bold text-purple-500 mb-1">{formatCurrencyM(annualDepreciationValue)}</div>
                    <div className="text-[11px] text-text-muted font-medium">Straight-line rate / yr</div>
                </div>

                {/* Card 4 */}
                <div className="bg-bg-card rounded-2xl p-5 border border-border-color border-l-4 border-l-red-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                            <Calculator size={14} />
                        </div>
                        ACCUMULATED DEPRECIATION
                    </div>
                    <div className="text-2xl font-bold text-red-500 mb-1">{formatCurrencyM(accumulatedDepreciationValue)}</div>
                    <div className="text-[11px] text-text-muted font-medium">Total loss to date</div>
                </div>

                {/* Card 5 */}
                <div className="bg-bg-card rounded-2xl p-5 border border-border-color border-l-4 border-l-emerald-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <TrendingUp size={14} />
                        </div>
                        CURRENT BOOK VALUE
                    </div>
                    <div className="text-2xl font-bold text-emerald-500 mb-1">{formatCurrencyM(bookValue)}</div>
                    <div className="text-[11px] text-text-muted font-medium">Cost minus accumulated</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donut Chart */}
                <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm p-6 flex flex-col">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1">Asset Distribution by Division</h2>
                        <p className="text-xs text-text-muted">Number of assets per division</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] relative mt-4">
                        {divisionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={divisionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {divisionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DIVISION_COLORS[index % DIVISION_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-text-muted text-sm">No data</div>
                        )}
                        <div className="w-full flex justify-center flex-wrap gap-x-6 gap-y-3 mt-4">
                            {divisionData.map((entry, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIVISION_COLORS[idx % DIVISION_COLORS.length] }}></div>
                                    <span className="text-[11px] font-bold" style={{ color: DIVISION_COLORS[idx % DIVISION_COLORS.length] }}>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm p-6 flex flex-col">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1">Value by Category</h2>
                        <p className="text-xs text-text-muted">Purchase cost by asset category</p>
                    </div>
                    <div className="flex-1 w-full min-h-[280px] mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color, #e5e7eb)" />
                                <XAxis type="number" tickFormatter={(val) => `₵${(val / 1000000).toFixed(2)}M`} tick={{ fontSize: 10, fill: 'var(--text-muted, #9ca3af)' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'var(--text-muted, #6b7280)', fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover, rgba(59,130,246,0.04))' }} />
                                <Bar dataKey="cost" barSize={14} radius={[0, 4, 4, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Category Summary Table */}
            <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-color flex justify-between items-center">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1">Category Summary</h2>
                        <p className="text-xs text-text-muted">Breakdown of purchase cost, annual depreciation, accumulated depreciation &amp; book value by category</p>
                    </div>
                    <div className="px-3 py-1 bg-bg-hover text-text-muted rounded-lg text-xs font-semibold border border-border-color">
                        {categoryData.length} categories
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-hover/50 font-bold border-b border-border-color">
                                <th className="py-4 px-6 font-bold">CATEGORY</th>
                                <th className="py-4 px-6 text-center font-bold">COUNT</th>
                                <th className="py-4 px-6 text-right font-bold">PURCHASE COST</th>
                                <th className="py-4 px-6 text-right font-bold">ANNUAL DEPR.</th>
                                <th className="py-4 px-6 text-right font-bold">ACCUMULATED DEPR.</th>
                                <th className="py-4 px-6 text-right font-bold">BOOK VALUE</th>
                                <th className="py-4 px-6 font-bold">SHARE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryData.map((row, idx) => {
                                const sharePct = totalValue > 0 ? ((row.cost / totalValue) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={idx} className="border-b border-border-color hover:bg-bg-hover/40 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-text-primary flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[row.name] || '#94a3b8' }}></div>
                                            {row.name}
                                        </td>
                                        <td className="py-4 px-6 text-text-secondary text-center font-medium">{row.count}</td>
                                        <td className="py-4 px-6 text-right font-medium text-blue-500">₵{row.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-6 text-right font-medium text-purple-500">
                                            {row.annualDepreciation === 0 ? '₵0.00' : `₵${row.annualDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-red-500">
                                            {row.accumulatedDepreciation === 0 ? '₵0.00' : `-₵${row.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-emerald-500">₵{row.bookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1 flex-1 bg-border-color rounded-full overflow-hidden w-24">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${sharePct}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-text-muted w-8">{sharePct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-primary/5">
                                <td className="py-4 px-6 font-bold text-primary uppercase tracking-widest text-xs">TOTALS</td>
                                <td className="py-4 px-6 text-primary text-center font-bold">{totalAssets}</td>
                                <td className="py-4 px-6 text-primary text-right font-bold">₵{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 text-purple-600 text-right font-bold">₵{annualDepreciationValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 text-red-500 text-right font-bold">-₵{accumulatedDepreciationValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 text-emerald-600 text-right font-bold">₵{bookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 text-primary text-[10px] font-bold">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Asset Depreciation & Accumulated Schedule Table */}
            <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-color flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1 flex items-center gap-2">
                            <Calculator size={18} className="text-primary" /> Fixed Assets Depreciation &amp; Accumulated Schedule
                        </h2>
                        <p className="text-xs text-text-muted">Itemized straight-line depreciation, accumulated loss, and net book value for each fixed asset</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                        <input
                            type="text"
                            value={deprSearch}
                            onChange={(e) => setDeprSearch(e.target.value)}
                            placeholder="Filter schedule by AIN or name..."
                            className="w-full pl-9 pr-4 py-2 bg-bg-hover/50 border border-border-color rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-bg-card z-10">
                            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-hover/70 font-bold border-b border-border-color">
                                <th className="py-3.5 px-5 font-bold">AIN</th>
                                <th className="py-3.5 px-5 font-bold">ASSET NAME</th>
                                <th className="py-3.5 px-5 font-bold">CATEGORY</th>
                                <th className="py-3.5 px-5 font-bold">PURCHASE DATE</th>
                                <th className="py-3.5 px-5 text-center font-bold">USEFUL LIFE</th>
                                <th className="py-3.5 px-5 text-right font-bold">COST</th>
                                <th className="py-3.5 px-5 text-right font-bold text-purple-500">ANNUAL DEPR.</th>
                                <th className="py-3.5 px-5 text-right font-bold text-red-500">ACCUMULATED DEPR.</th>
                                <th className="py-3.5 px-5 text-right font-bold text-emerald-500">CURRENT BOOK VALUE</th>
                                <th className="py-3.5 px-5 text-center font-bold">ACCUM. %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nonArchivedApprovedAssets
                                .filter(a => a.major_category === 'Fixed Asset')
                                .filter(a => {
                                    if (!deprSearch) return true;
                                    const q = deprSearch.toLowerCase();
                                    return (a.ain || '').toLowerCase().includes(q) ||
                                           (a.asset_name || '').toLowerCase().includes(q) ||
                                           (a.category || '').toLowerCase().includes(q) ||
                                           (a.division || '').toLowerCase().includes(q);
                                })
                                .map((asset) => {
                                    const depr = calculateDepreciation(asset);
                                    const cost = parseFloat(asset.purchase_cost) || 0;
                                    const pct = cost > 0 ? Math.min(100, Math.round((depr.accumulatedDepreciation / cost) * 100)) : 0;

                                    return (
                                        <tr key={asset.id || asset.ain} className="border-b border-border-color hover:bg-bg-hover/30 transition-colors">
                                            <td className="py-3.5 px-5 font-mono font-semibold text-primary">{asset.ain || 'N/A'}</td>
                                            <td className="py-3.5 px-5 font-medium text-text-primary">{asset.asset_name}</td>
                                            <td className="py-3.5 px-5 text-text-muted">{asset.category || 'General'}</td>
                                            <td className="py-3.5 px-5 text-text-muted">{asset.purchase_date ? asset.purchase_date.split('T')[0] : 'N/A'}</td>
                                            <td className="py-3.5 px-5 text-center text-text-muted font-semibold">{asset.useful_life ? `${asset.useful_life} yrs` : '5 yrs'}</td>
                                            <td className="py-3.5 px-5 text-right font-medium text-text-primary">₵{cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-3.5 px-5 text-right font-medium text-purple-500">₵{depr.annualDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-3.5 px-5 text-right font-medium text-red-500">-₵{depr.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-3.5 px-5 text-right font-bold text-emerald-500">₵{depr.currentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-3.5 px-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-12 h-1.5 bg-border-color rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-text-muted">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {nonArchivedApprovedAssets.filter(a => a.major_category === 'Fixed Asset').length === 0 && (
                                <tr>
                                    <td colSpan="10" className="py-8 text-center text-text-muted text-xs font-medium">
                                        No approved fixed assets available for depreciation schedule.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom 2 Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Report Builder */}
                <div className="lg:col-span-2 bg-bg-card rounded-3xl border border-border-color shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1">Report Builder</h2>
                        <p className="text-xs text-text-muted mb-8">Filter and export custom reports</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="relative">
                                <label className="text-[10px] uppercase text-text-muted font-bold mb-2 block">CATEGORY</label>
                                <div className="relative border border-border-color rounded-xl bg-bg-hover/30 hover:bg-bg-hover transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
                                    <select
                                        className="w-full bg-transparent appearance-none px-4 py-3 text-sm text-text-primary outline-none cursor-pointer"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {Array.from(new Set(nonArchivedApprovedAssets.filter(a => a.category).map(a => a.category))).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] uppercase text-text-muted font-bold mb-2 block">DIVISION</label>
                                <div className="relative border border-border-color rounded-xl bg-bg-hover/30 hover:bg-bg-hover transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
                                    <select
                                        className="w-full bg-transparent appearance-none px-4 py-3 text-sm text-text-primary outline-none cursor-pointer"
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                    >
                                        <option value="">All Divisions</option>
                                        {Array.from(new Set(nonArchivedApprovedAssets.filter(a => a.division).map(a => a.division))).map(div => (
                                            <option key={div} value={div}>{div}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] uppercase text-text-muted font-bold mb-2 block">STATUS</label>
                                <div className="relative border border-border-color rounded-xl bg-bg-hover/30 hover:bg-bg-hover transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
                                    <select
                                        className="w-full bg-transparent appearance-none px-4 py-3 text-sm text-text-primary outline-none cursor-pointer"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        {Array.from(new Set(nonArchivedApprovedAssets.filter(a => a.status).map(a => a.status))).map(stat => (
                                            <option key={stat} value={stat}>{stat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase text-text-muted font-bold mb-3 block">EXPORT COLUMNS</label>
                            <div className="flex flex-wrap gap-2">
                                {exportColumns.map((col, idx) => {
                                    const isSelected = selectedCols.includes(col);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (isSelected && selectedCols.length > 1) {
                                                    setSelectedCols(selectedCols.filter(c => c !== col));
                                                } else if (!isSelected) {
                                                    setSelectedCols([...selectedCols, col]);
                                                }
                                            }}
                                            className={`rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border ${isSelected
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'bg-bg-hover border-border-color text-text-muted hover:bg-bg-hover/80'
                                                }`}
                                        >
                                            <div className={`flex items-center justify-center w-3 h-3 rounded text-white ${isSelected ? 'bg-primary' : 'bg-transparent border border-border-color'}`}>
                                                {isSelected && <Check size={10} strokeWidth={4} />}
                                            </div>
                                            {col}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-border-color pt-6">
                        <div>
                            <p className="text-text-secondary text-sm font-semibold">{filteredExportAssets.length} assets matched filtering</p>
                            <p className="text-[11px] text-text-muted font-medium tracking-wide mt-1">
                                MATCHED VALUE: <span className="text-primary text-sm font-bold ml-1">
                                    ₵{filteredExportAssets.reduce((sum, a) => sum + (parseFloat(a.purchase_cost) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition-colors"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm p-6 flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-text-primary font-bold mb-1">Status Breakdown</h2>
                        <p className="text-xs text-text-muted">Current condition &amp; status of all assets ({totalApprovedCount})</p>
                    </div>

                    <div className="space-y-4 mt-2 flex-1 flex flex-col overflow-y-auto pr-2 max-h-[400px]">
                        {/* Good Condition */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Good
                                </div>
                                <div className="text-text-secondary font-bold">{goodCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((goodCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (goodCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Fair Condition */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Fair
                                </div>
                                <div className="text-text-secondary font-bold">{fairCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((fairCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (fairCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Poor Condition */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div> Poor
                                </div>
                                <div className="text-text-secondary font-bold">{poorCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((poorCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-red-600 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (poorCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Active
                                </div>
                                <div className="text-text-secondary font-bold">{activeCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((activeCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (activeCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Maintenance Status */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Maintenance
                                </div>
                                <div className="text-text-secondary font-bold">{maintenanceCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((maintenanceCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (maintenanceCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Inactive Status */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-500"></div> Inactive
                                </div>
                                <div className="text-text-secondary font-bold">{inactiveCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((inactiveCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (inactiveCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Disposed Status */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-900"></div> Disposed
                                </div>
                                <div className="text-text-secondary font-bold">{disposedCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((disposedCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-red-900 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (disposedCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Archived Status */}
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div> Archived
                                </div>
                                <div className="text-text-secondary font-bold">{archivedCount}</div>
                            </div>
                            <div className="flex justify-end text-[9px] text-text-muted mb-1 font-bold">{totalApprovedCount > 0 ? Math.round((archivedCount / totalApprovedCount) * 100) : 0}%</div>
                            <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${totalApprovedCount > 0 ? (archivedCount / totalApprovedCount) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-6 shrink-0 w-full px-6 bg-bg-hover/50 py-4 rounded-2xl border border-border-color shrink-0">
                            <div className="text-center w-1/2">
                                <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">FIXED</div>
                                <div className="text-lg font-bold text-text-primary">{fixedCount}</div>
                            </div>
                            <div className="border-l border-border-color"></div>
                            <div className="text-center w-1/2">
                                <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">NON-FIXED</div>
                                <div className="text-lg font-bold text-text-primary">{nonFixedCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};

export default ReportsAnalytics;
