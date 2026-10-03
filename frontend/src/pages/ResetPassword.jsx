import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        const result = await resetPassword(token, formData.password);

        if (result.success) {
            // Success toast is handled in AuthContext
            navigate('/login', { replace: true });
        } else {
            setError('Failed to reset password. The link may be expired or invalid.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-dark))] relative overflow-hidden p-4">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="flex flex-col items-center gap-0 mb-4">
                        <div className="h-[150px] w-auto flex items-center justify-center">
                            <img src="/logo.png" alt="HIGHWAYS Logo" className="h-full object-contain" />
                        </div>
                        <div className="flex flex-col items-center text-center -mt-8">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-[0.3em] whitespace-nowrap leading-none">Ghana Highway Authority</span>
                            <h1 className="text-2xl font-bold text-text-primary tracking-[0.15em] mt-1 text-glow leading-tight">ASSET MANAGEMENT SYSTEM</h1>
                        </div>
                    </div>
                    <p className="text-text-secondary font-medium">Reset Your Password</p>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-secondary ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-secondary ml-1">Confirm New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold"
                            >
                                <span className="mt-0.5 w-2 h-2 rounded-full bg-danger animate-pulse flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin"></div>
                                    Updating Password...
                                </>
                            ) : (
                                <>
                                    Complete Reset
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full mt-6 flex items-center justify-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Login
                    </button>
                </div>
            </motion.div>

            {/* Footer Branding */}
            <div className="fixed bottom-10 right-10 flex items-center gap-5 z-10 hidden md:flex opacity-90">
                <div className="text-right select-none pointer-events-none">
                    <p className="text-xs text-text-primary font-black tracking-widest uppercase">Asset Management System</p>
                    <p className="text-[11px] text-text-muted uppercase font-black tracking-[0.25em] leading-tight mb-1">Ghana Highway Authority | Head Office, Accra</p>
                </div>
                <div className="h-24 w-auto">
                    <img
                        src="/coat_of_arms.jpg"
                        alt="Coat of Arms"
                        className="h-full object-contain filter contrast-125 brightness-110"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
