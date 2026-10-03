import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Truck,
    FileText,
    Settings,
    Menu,
    X,
    Bell,
    User,
    Users,
    Search,
    Briefcase,
    Database,
    History,
    Archive,
    PieChart,
    FolderArchive
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import UserProfileMenu from '../components/UserProfileMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, collapsed, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`
        }
    >
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative z-10"
        >
            <Icon size={20} className="shrink-0" strokeWidth={2} />
        </motion.div>

        {!collapsed && (
            <span className="font-semibold text-sm whitespace-nowrap overflow-hidden z-10">{label}</span>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-lg bg-primary opacity-0 group-hover:opacity-5 transition-opacity" />
    </NavLink>
);

const MobileNavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center p-2 pt-3 pb-2 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`
        }
    >
        {({ isActive }) => (
            <>
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    animate={{ y: isActive ? -2 : 0 }}
                    className="relative"
                >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                        <motion.span layoutId="mobileNavIndicator" className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                </motion.div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
            </>
        )}
    </NavLink>
);

const MainLayout = () => {
    const { user, permissions } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="flex h-screen bg-bg-dark text-text-primary overflow-hidden bg-mesh">

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-bg-card border-r border-border-color z-40 flex flex-col h-full transition-all duration-300 shadow-premium
                           fixed md:relative top-0 left-0 bottom-0
                           ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                           ${collapsed ? 'md:w-[80px]' : 'w-[260px] md:w-[260px]'}`}
            >
                {/* Brand */}
                <div className={`py-2 border-b border-border-color flex items-center justify-between relative ${collapsed ? 'px-2' : 'px-4'}`}>
                    <button
                        onClick={closeMobileMenu}
                        className="md:hidden absolute top-4 right-4 p-2 text-text-muted hover:text-primary bg-bg-hover rounded-xl z-50 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col items-center gap-0 w-full">
                        <div className="h-[120px] w-auto flex items-center justify-center shrink-0">
                            <img src="/logo.png" alt="Logo" className="h-full object-contain" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col items-center text-center -mt-9">
                                <span className="text-[9px] text-text-muted uppercase font-bold tracking-[0.1em] whitespace-nowrap leading-none">Ghana Highway Authority</span>
                                <span className="font-bold text-[12px] text-text-primary uppercase tracking-[0.1em] mt-1 leading-tight">Asset Management System</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <div className="px-3 mb-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] opacity-60">
                        {collapsed ? '—' : 'Main Menu'}
                    </div>
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onClick={closeMobileMenu} />
                    <SidebarItem to="/assets" icon={Database} label="Asset Inventory" collapsed={collapsed} onClick={closeMobileMenu} />
                    <SidebarItem to="/category-summary" icon={PieChart} label="Category Summary" collapsed={collapsed} onClick={closeMobileMenu} />
                    <SidebarItem to="/maintenance" icon={Truck} label="Maintenance" collapsed={collapsed} onClick={closeMobileMenu} />
                    <SidebarItem to="/disposed" icon={Archive} label="Disposed Assets" collapsed={collapsed} onClick={closeMobileMenu} />

                    {permissions.canManageUsers(user) && (
                        <>
                            <SidebarItem to="/users" icon={Users} label="User Management" collapsed={collapsed} onClick={closeMobileMenu} />
                            <SidebarItem to="/archived" icon={FolderArchive} label="Archived Assets" collapsed={collapsed} onClick={closeMobileMenu} />
                        </>
                    )}
                    <SidebarItem to="/reports" icon={FileText} label="Reports" collapsed={collapsed} onClick={closeMobileMenu} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-border-color space-y-1">
                    <SidebarItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} onClick={closeMobileMenu} />
                </div>

                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-20 bg-bg-card border border-border-color rounded-full p-1.5 text-text-muted hover:text-primary shadow-premium transition-all hover:scale-110 active:scale-95 items-center justify-center"
                >
                    {collapsed ? <Menu size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">

                {/* Topbar */}
                <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 z-20 border-b border-border-color bg-white/50 backdrop-blur-md relative">

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-text-primary focus:outline-none hover:bg-bg-hover rounded-lg transition-colors z-50 relative"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMobileMenuOpen(!mobileMenuOpen);
                        }}
                    >
                        <Menu size={24} />
                    </button>

                    {/* Global Search */}
                    <div className="relative w-full max-w-xl hidden md:block group ml-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} strokeWidth={2} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="Search assets, projects, or staff..."
                            className="w-full bg-bg-dark border border-border-color rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-text-muted/50 text-text-primary font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger transition-colors"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        )}

                        {/* Mock Search Results Shimmer/Indicator */}
                        {searchQuery && (
                            <div className="absolute top-full left-0 w-full mt-2 glass-panel rounded-2xl p-4 z-50 animate-fade-in">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Recent Matches</p>
                                <div className="space-y-2">
                                    <div className="p-2 rounded-xl border border-transparent hover:border-border-color hover:bg-bg-hover transition-all cursor-pointer flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <Briefcase size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">Accra Tema Motorway</p>
                                            <p className="text-[10px] text-text-muted uppercase">Project • Planning</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl border border-transparent hover:border-border-color hover:bg-bg-hover transition-all cursor-pointer flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                                            <Truck size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">Toyota Land Cruiser - GV 123-24</p>
                                            <p className="text-[10px] text-text-muted uppercase">Asset • Vehicles</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'navy' : 'dark')}
                            className="p-2 rounded-full border border-border-color text-text-muted hover:text-primary transition-colors bg-bg-card shadow-sm"
                            title="Toggle Dark Mode"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <NotificationBell />

                        <div className="h-8 w-[1px] bg-border-color opacity-50"></div>

                        <UserProfileMenu />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-20 md:pb-8 scroll-smooth bg-mesh min-w-0 w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-xl border-t border-border-color z-40 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
                    <MobileNavItem to="/" icon={LayoutDashboard} label="Home" />
                    <MobileNavItem to="/assets" icon={Database} label="Assets" />
                    <MobileNavItem to="/maintenance" icon={Truck} label="Tasks" />
                    <MobileNavItem to="/reports" icon={PieChart} label="Reports" />
                    <MobileNavItem to="/settings" icon={Settings} label="Settings" />
                </nav>

            </div>
        </div>
    );
};

export default MainLayout;
