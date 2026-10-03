import React from 'react';
import { TrendingUp, Truck, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const colorVariants = {
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        hover: 'group-hover:bg-blue-500/20'
    },
    gold: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        hover: 'group-hover:bg-accent/20'
    },
    navy: { // Replaced 'green' with 'navy'
        bg: 'bg-primary/10', // Using primary for themed navy
        text: 'text-primary',
        hover: 'group-hover:bg-primary/20'
    },
    red: {
        bg: 'bg-danger/10',
        text: 'text-danger',
        hover: 'group-hover:bg-danger/20'
    }
};

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue, color, delay, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay }}
        onClick={onClick}
        className={`glass-panel p-6 rounded-xl hover:translate-y-[-2px] transition-all duration-300 group relative overflow-visible ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-primary/30' : ''}`}
    >
        <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.1em] mb-2">{title}</p>
                <h3 className="text-3xl font-bold text-text-primary transition-transform">{value}</h3>
            </div>
            {/* Overlapping Icon - positioned to overflow card boundary */}
            <div className={`absolute -top-3 -right-3 p-4 rounded-xl ${colorVariants[color].bg} ${colorVariants[color].text} transition-all shadow-md border-4 border-bg-dark ${onClick ? 'group-hover:scale-110' : ''}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
            {trend === 'up' ? (
                <TrendingUp size={14} className="text-success" strokeWidth={2.5} />
            ) : (
                <AlertTriangle size={14} className="text-warning" strokeWidth={2.5} />
            )}
            <span className={`font-semibold ${trend === 'up' ? "text-success" : "text-warning"}`}>
                {trendValue}
            </span>
            <span className="text-text-muted">· {subtext}</span>
        </div>

        {onClick && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Click to view →</span>
            </div>
        )}
    </motion.div>
);

const StatsOverview = ({ stats, onStatClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
                title="Total Assets"
                value={stats.totalAssets.toLocaleString()}
                subtext="Overall inventory"
                trend="up"
                trendValue="+12"
                icon={MapPin}
                color="blue"
                delay={0.1}
                onClick={() => onStatClick?.('totalAssets')}
            />
            <StatCard
                title="Active Assets"
                value={stats.activeAssets}
                subtext="Total active assets"
                trend="up"
                trendValue="Online"
                icon={CheckCircle}
                color="gold"
                delay={0.2}
                onClick={() => onStatClick?.('activeAssets')}
            />
            <StatCard
                title="Maintenance Tasks"
                value={stats.maintenanceAssets}
                subtext="Assets being serviced"
                trend="down"
                trendValue="Working on it"
                icon={AlertTriangle}
                color="navy"
                delay={0.3}
                onClick={() => onStatClick?.('maintenanceAssets')}
            />
            <StatCard
                title="Pending Assets"
                value={stats.pendingAssets}
                subtext="Awaiting Approval"
                trend="up"
                trendValue="Action Required"
                icon={Clock}
                color="navy"
                delay={0.4}
                onClick={() => onStatClick?.('pendingAssets')}
            />
            <StatCard
                title="Asset Health"
                value={`${stats.equipmentHealth}%`}
                subtext="Operational status"
                trend="up"
                trendValue="Stable"
                icon={TrendingUp}
                color="red"
                delay={0.5}
                onClick={() => onStatClick?.('equipmentHealth')}
            />
        </div>
    );
};

export default StatsOverview;
