import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart2 } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { calculateDepreciation } from '../utils/depreciation';

const CATEGORY_COLORS = {
    'Land and building': '#10b981',
    'Plant and Machinery': '#f59e0b',
    'Fleets': '#3b82f6',
    'Furniture and office Equipment': '#ef4444',
    'IT and Technical': '#8b5cf6',
    'General': '#14b8a6',
    'Utility Equipment': '#06b6d4',
    'Installed Infrastructure & Utility System': '#f97316',
};

const CategorySummary = () => {
    const { assets } = useAssets();
    const [search, setSearch] = useState('');

    const { categoryData, totalAssets, totalValue, bookValue, annualDepreciationValue, accumulatedDepreciationValue } = useMemo(() => {
        const approvedAssets = assets.filter(a => a.approval_status === 'Approved' && !['archived', 'disposed', 'scrapped', 'sold'].includes((a.status || '').toLowerCase()));
        const categories = {};
        let tVal = 0, bVal = 0, annDeprVal = 0, accDeprVal = 0;

        approvedAssets.forEach(a => {
            const cat = a.category || 'General';
            const cost = parseFloat(a.purchase_cost) || 0;
            tVal += cost;

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
                bVal += depr.currentBookValue;
                annDeprVal += depr.annualDepreciation;
                accDeprVal += depr.accumulatedDepreciation;
            } else {
                categories[cat].bookValue += cost;
                bVal += cost;
            }
        });

        return {
            categoryData: Object.values(categories).sort((a, b) => b.cost - a.cost),
            totalAssets: approvedAssets.length,
            totalValue: tVal,
            bookValue: bVal,
            annualDepreciationValue: annDeprVal,
            accumulatedDepreciationValue: accDeprVal,
        };
    }, [assets]);

    const filtered = categoryData.filter(row =>
        row.name.toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (val) => `₵${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-primary tracking-tight">Category Summary</h1>
                    <p className="text-text-muted text-sm">Detailed breakdown of all approved assets by category</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search category..."
                        className="pl-10 pr-4 py-2.5 bg-bg-card border border-border-color rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all w-full"
                    />
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Assets', value: totalAssets, color: 'text-primary', sub: `${categoryData.length} categories` },
                    { label: 'Total Purchase Value', value: fmt(totalValue), color: 'text-orange-500', sub: 'Approved assets' },
                    { label: 'Annual Depreciation', value: fmt(annualDepreciationValue), color: 'text-purple-500', sub: 'Yearly rate' },
                    { label: 'Accumulated Depreciation', value: fmt(accumulatedDepreciationValue), color: 'text-red-500', sub: 'Total loss to date' },
                    { label: 'Current Book Value', value: fmt(bookValue), color: 'text-emerald-500', sub: 'Net balance' },
                ].map((card, i) => (
                    <div key={i} className="bg-bg-card rounded-2xl p-5 border border-border-color shadow-sm">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{card.label}</p>
                        <p className={`text-xl font-bold ${card.color} mb-1`}>{card.value}</p>
                        <p className="text-xs text-text-muted">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-bg-card rounded-3xl border border-border-color shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-color flex justify-between items-center">
                    <div>
                        <h2 className="text-text-primary font-bold mb-1 flex items-center gap-2">
                            <BarChart2 size={18} className="text-primary" />
                            Asset Category Breakdown
                        </h2>
                        <p className="text-xs text-text-muted">Purchase cost, annual depreciation, accumulated depreciation, and book value per category</p>
                    </div>
                    <div className="px-3 py-1 bg-bg-secondary text-text-muted rounded-lg text-xs font-semibold border border-border-color">
                        {filtered.length} categories
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-secondary/50 font-bold border-b border-border-color">
                                <th className="py-4 px-6 font-bold whitespace-nowrap">Category</th>
                                <th className="py-4 px-6 text-center font-bold whitespace-nowrap">Count</th>
                                <th className="py-4 px-6 text-right font-bold whitespace-nowrap">Purchase Cost</th>
                                <th className="py-4 px-6 text-right font-bold whitespace-nowrap text-purple-500">Annual Depr.</th>
                                <th className="py-4 px-6 text-right font-bold whitespace-nowrap text-red-500">Accumulated Depr.</th>
                                <th className="py-4 px-6 text-right font-bold whitespace-nowrap text-emerald-500">Book Value</th>
                                <th className="py-4 px-6 font-bold whitespace-nowrap">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-text-muted text-sm">
                                        No categories match your search.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filtered.map((row, idx) => {
                                        const sharePct = totalValue > 0 ? ((row.cost / totalValue) * 100).toFixed(1) : 0;
                                        const color = CATEGORY_COLORS[row.name] || '#94a3b8';
                                        return (
                                            <tr key={idx} className="border-b border-border-color hover:bg-bg-secondary/40 transition-colors">
                                                <td className="py-4 px-6 font-semibold text-text-primary">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                                        {row.name}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-text-secondary text-center font-medium">{row.count}</td>
                                                <td className="py-4 px-6 text-right font-medium text-blue-500">{fmt(row.cost)}</td>
                                                <td className="py-4 px-6 text-right font-medium text-purple-500">{fmt(row.annualDepreciation)}</td>
                                                <td className="py-4 px-6 text-right font-medium text-red-500">-{fmt(row.accumulatedDepreciation)}</td>
                                                <td className="py-4 px-6 text-right font-medium text-emerald-500">{fmt(row.bookValue)}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 flex-1 bg-border-color rounded-full overflow-hidden min-w-[60px]">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${sharePct}%`, backgroundColor: color }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-text-muted w-9 shrink-0">{sharePct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Totals row */}
                                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                                        <td className="py-4 px-6 font-bold text-primary uppercase tracking-widest text-xs">TOTALS</td>
                                        <td className="py-4 px-6 text-primary text-center font-bold">{totalAssets}</td>
                                        <td className="py-4 px-6 text-primary text-right font-bold">{fmt(totalValue)}</td>
                                        <td className="py-4 px-6 text-purple-600 text-right font-bold">{fmt(annualDepreciationValue)}</td>
                                        <td className="py-4 px-6 text-red-500 text-right font-bold">-{fmt(accumulatedDepreciationValue)}</td>
                                        <td className="py-4 px-6 text-emerald-600 text-right font-bold">{fmt(bookValue)}</td>
                                        <td className="py-4 px-6 text-primary text-[10px] font-bold">100%</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default CategorySummary;
