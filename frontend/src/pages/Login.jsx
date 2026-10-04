import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Shield, Users, UserPlus, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    // view: 'admin' | 'forgot' | 'reset'
    const [view, setView] = useState('admin');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        staffId: '',
        phone: '',
        dob: '',
        position: '',
        division: '',
        otp: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup, verifyEmail, resendVerification, setInitialPassword, forgotPassword, verifyResetOtp, resetPassword, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pendingRedirect = useRef(null);

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationOtp, setVerificationOtp] = useState('');
    const [resetStep, setResetStep] = useState('otp'); // 'otp' | 'password'
    const [resendTimer, setResendTimer] = useState(0);
    // Set-Password state (after email verification)
    const [setPasswordToken, setSetPasswordToken] = useState('');
    const [setPasswordData, setSetPasswordData] = useState({ password: '', confirmPassword: '' });

    // Resend Timer Logic
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        // If we are showing the verification screen, use resendVerification
        // Otherwise, it might be the reset screen, but that has its own resend logic.
        const theEmail = formData.email || verificationEmail;
        const result = view === 'admin' || showVerification
            ? await resendVerification(theEmail)
            : await forgotPassword(theEmail);

        if (result.success) {
            setResendTimer(60);
        }
        setIsLoading(false);
    };

    // Redirect to the page they tried to visit or dashboard
    const from = location.state?.from?.pathname || '/';

    // Navigate after auth state has updated (so ProtectedRoute sees isAuthenticated true)
    useEffect(() => {
        if (!isAuthenticated || location.pathname !== '/login') return;
        if (pendingRedirect.current) {
            const path = pendingRedirect.current;
            pendingRedirect.current = null;
            navigate(path, { replace: true });
        }
        // Do NOT auto-redirect if just visiting /login while already authenticated
        // User might intentionally be on the login page or switching portals
    }, [isAuthenticated, location.pathname, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (showVerification) setShowVerification(false);
    };

    const [loginError, setLoginError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');
        const result = await login(formData.email, formData.password);

        if (result.success) {
            const path = from && from !== '/login' ? from : '/';
            navigate(path, { replace: true });
        } else if (result.reason === 'email_unverified') {
            setVerificationEmail(formData.email);
            setShowVerification(true);
        } else {
            // Show inline error for invalid credentials, pending, suspended, and other errors
            setLoginError(result.message || 'Invalid credentials. Please try again.');
        }
        setIsLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Validation: Confirm Password
        if (formData.password !== formData.confirmPassword) {
            setLoginError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        const result = await signup(
            formData.name,
            formData.email,
            formData.password,
            formData.position || 'Worker',
            formData.division || 'General',
            { phone: formData.phone, staffId: formData.staffId, dob: formData.dob }
        );

        if (result.success) {
            // Registration successful, now show verification screen
            setLoginError('');
            setShowVerification(true);
            setVerificationEmail(formData.email);
        }
        setIsLoading(false);
    };

    const handleVerification = async (e) => {
        if (e) e.preventDefault();
        if (!verificationOtp) return;

        setIsLoading(true);
        const result = await verifyEmail(verificationEmail, verificationOtp);
        if (result.success) {
            setShowVerification(false);
            setVerificationOtp('');
            // Backend now returns a set_password_token — send user to set their own private password
            if (result.set_password_token) {
                setSetPasswordToken(result.set_password_token);
                setView('set-password');
            } else {
                // Fallback: shouldn't normally happen
                setLoginError('Email verified. Please log in.');
                setView('admin');
            }
        }
        setIsLoading(false);
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-dark))] relative overflow-hidden p-4">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" />

            <motion.div
                layout
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
                    {view === 'admin' && <p className="text-text-secondary font-medium"></p>}
                </div>

                <AnimatePresence mode="wait">
                    {view === 'admin' && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary ml-1">Email Address</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                placeholder="admin@gha.gov.gh"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-sm font-semibold text-text-secondary">Password</label>
                                            <button
                                                type="button"
                                                onClick={() => setView('forgot')}
                                                className="text-xs font-bold text-primary hover:text-primary-light transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-12 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline status error (e.g. pending / suspended) */}
                                    {loginError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-2.5 p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs font-semibold"
                                        >
                                            <span className="mt-0.5 w-2 h-2 rounded-full bg-warning animate-pulse flex-shrink-0" />
                                            {loginError}
                                        </motion.div>
                                    )}

                                    {showVerification ? (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Email Verification Required</p>
                                                <p className="text-[10px] text-text-muted">An OTP has been sent to your email. Please enter it below to activate your account.</p>
                                            </div>
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="6-Digit OTP"
                                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary text-center tracking-[0.5em] font-mono focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                    value={verificationOtp}
                                                    onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    maxLength="6"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleVerification}
                                                disabled={isLoading || verificationOtp.length !== 6}
                                                className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <span className="text-white">Verifying...</span>
                                                ) : (
                                                    <span className="text-white font-bold">Verify & Login</span>
                                                )}
                                                {!isLoading && <ArrowRight size={20} className="text-white" />}
                                            </button>
                                            <div className="text-center">
                                                <p className="text-[10px] text-text-muted">
                                                    Didn't receive the code?
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        className="text-primary font-bold ml-1 hover:underline disabled:opacity-50"
                                                        disabled={isLoading || resendTimer > 0}
                                                    >
                                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                                    </button>
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowVerification(false)}
                                                className="w-full text-xs text-text-muted hover:text-white transition-colors py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span className="text-white font-bold">Logging in...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-white font-bold text-base">Login</span>
                                                    <ArrowRight size={18} className="text-white" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {view === 'forgot' && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                                <button
                                    onClick={() => {
                                        setView('admin');
                                        setFormData({ ...formData, email: '' });
                                        setLoginError('');
                                    }}
                                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white mb-6 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Back to Login
                                </button>

                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-text-primary mb-2">Reset Password</h2>
                                    <p className="text-sm text-text-muted">Enter your email address or mobile number and we'll send you instructions to reset your password.</p>
                                </div>

                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        setIsLoading(true);
                                        setLoginError('');
                                        const result = await forgotPassword(formData.email);
                                        if (result.success) {
                                            setLoginError('SENT');
                                            setResetStep('otp');
                                        } else {
                                            setLoginError(result.message || 'Failed to send reset instructions.');
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary ml-1">Email or Mobile Number</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="text"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                placeholder="Email Address or Mobile Number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {loginError && (
                                        <div className={`p-4 rounded-xl text-sm font-semibold leading-relaxed ${loginError === 'SENT' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-warning/10 border border-warning/30 text-warning'}`}>
                                            {loginError === 'SENT' ? (
                                                <div className="space-y-2 text-center py-2">
                                                    <div className="flex justify-center mb-2">
                                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                            <Mail className="text-primary" size={24} />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-text-primary">Reset instructions sent!</p>
                                                    <p className="text-xs text-text-muted">Please check your registered email or mobile number for a reset link or OTP code. It should arrive within a few minutes.</p>
                                                </div>
                                            ) : loginError}
                                        </div>
                                    )}

                                    {loginError === 'SENT' ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView('reset');
                                                setLoginError('');
                                            }}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99]"
                                        >
                                            Continue to Reset Password
                                            <ArrowRight size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin"></div>
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    Send OTP
                                                    <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {view === 'reset' && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                                <button
                                    onClick={() => {
                                        setView('forgot');
                                        setLoginError('');
                                    }}
                                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white mb-6 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>

                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-text-primary mb-2">
                                        {resetStep === 'otp' ? 'Verify OTP' : 'Set New Password'}
                                    </h2>
                                    <p className="text-sm text-text-muted">
                                        {resetStep === 'otp'
                                            ? 'Please enter the 6-digit code sent to your email.'
                                            : 'OTP verified! Now choose a secure new password for your account.'}
                                    </p>
                                </div>

                                {resetStep === 'otp' ? (
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            setIsLoading(true);
                                            setLoginError('');
                                            const result = await verifyResetOtp(formData.otp);
                                            if (result.success) {
                                                setResetStep('password');
                                            } else {
                                                setLoginError(result.message || 'Invalid or expired OTP');
                                            }
                                            setIsLoading(false);
                                        }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-text-secondary ml-1">6-Digit OTP</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    name="otp"
                                                    value={formData.otp || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-mono text-center tracking-widest text-lg"
                                                    placeholder="000000"
                                                    maxLength="6"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {loginError && (
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold leading-relaxed">
                                                {loginError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || formData.otp?.length !== 6}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                                            {!isLoading && <Shield size={20} />}
                                        </button>

                                        <div className="text-center">
                                            <p className="text-xs text-text-muted">
                                                Didn't receive the code?
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    className="text-primary font-bold ml-1 hover:underline disabled:opacity-50"
                                                    disabled={isLoading || resendTimer > 0}
                                                >
                                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                ) : (
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (formData.password !== formData.confirmPassword) {
                                                setLoginError('Passwords do not match');
                                                return;
                                            }
                                            setIsLoading(true);
                                            setLoginError('');
                                            const result = await resetPassword(formData.otp, formData.password);
                                            if (result.success) {
                                                setView('admin');
                                                setFormData({ ...formData, password: '', confirmPassword: '', otp: '', email: '' });
                                                setResetStep('otp');
                                            } else {
                                                setLoginError(result.message || 'Failed to reset password.');
                                            }
                                            setIsLoading(false);
                                        }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-text-secondary ml-1">New Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-text-secondary ml-1">Confirm New Password</label>
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {loginError && (
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold leading-relaxed">
                                                {loginError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Resetting...' : 'Update Password'}
                                            {!isLoading && <ArrowRight size={20} />}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {view === 'set-password' && (
                        <motion.div
                            key="set-password"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                                {/* Header */}
                                <div className="flex flex-col items-center text-center mb-8">
                                    <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4 ring-2 ring-success/30">
                                        <Shield className="text-success" size={30} />
                                    </div>
                                    <h2 className="text-xl font-bold text-text-primary mb-1">Set Your Personal Password</h2>
                                    <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                                        Your email has been verified. Choose a strong, private password that only you will know.
                                        No one else — including administrators — will have access to it.
                                    </p>
                                </div>

                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (setPasswordData.password !== setPasswordData.confirmPassword) {
                                            setLoginError('Passwords do not match.');
                                            return;
                                        }
                                        setIsLoading(true);
                                        setLoginError('');
                                        const result = await setInitialPassword(setPasswordToken, setPasswordData.password);
                                        if (result.success) {
                                            if (result.autoLoggedIn) {
                                                // Auth state is set — navigate to dashboard
                                                const path = from && from !== '/login' ? from : '/';
                                                pendingRedirect.current = path;
                                                navigate(path, { replace: true });
                                            } else {
                                                setView('admin');
                                                setLoginError('Password set! Please log in.');
                                            }
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="password"
                                                value={setPasswordData.password}
                                                onChange={(e) => setSetPasswordData(p => ({ ...p, password: e.target.value }))}
                                                className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                placeholder="Min 8 chars, upper, lower, number"
                                                required
                                                minLength={8}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="password"
                                                value={setPasswordData.confirmPassword}
                                                onChange={(e) => setSetPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                                className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-3.5 pl-11 pr-4 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        {/* Live match indicator */}
                                        {setPasswordData.confirmPassword && (
                                            <p className={`text-xs ml-1 font-semibold transition-colors ${setPasswordData.password === setPasswordData.confirmPassword ? 'text-success' : 'text-danger'}`}>
                                                {setPasswordData.password === setPasswordData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                            </p>
                                        )}
                                    </div>

                                    {loginError && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
                                            {loginError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || setPasswordData.password !== setPasswordData.confirmPassword || setPasswordData.password.length < 8}
                                        className="w-full bg-gradient-to-r from-success to-success/80 hover:to-success text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-success/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Activating Account...
                                            </>
                                        ) : (
                                            <>
                                                Set Password & Enter Dashboard
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {view === 'signup' && (
                        <motion.div
                            key="signup"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
                                <button
                                    onClick={() => setView('select')}
                                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white mb-6 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Back to Selection
                                </button>

                                {showVerification ? (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Mail className="text-primary" size={32} />
                                            </div>
                                            <h2 className="text-xl font-bold text-text-primary mb-2">Verify Your Email</h2>
                                            <p className="text-sm text-text-muted">
                                                We've sent a 6-digit verification code to <span className="text-primary font-bold">{verificationEmail}</span>.
                                                Please enter it below to activate your account.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-4 pl-12 pr-4 text-text-primary text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                                    value={verificationOtp}
                                                    onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    maxLength="6"
                                                    required
                                                />
                                            </div>

                                            <button
                                                onClick={handleVerification}
                                                disabled={isLoading || verificationOtp.length !== 6}
                                                className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? 'Verifying...' : 'Verify Account'}
                                                {!isLoading && <ArrowRight size={20} />}
                                            </button>

                                            <div className="text-center">
                                                <p className="text-xs text-text-muted">
                                                    Didn't receive the code?
                                                    <button
                                                        type="button"
                                                        onClick={() => signup(formData.name, formData.email, formData.password, formData.position, formData.division, { phone: formData.phone })}
                                                        className="text-primary font-bold ml-1 hover:underline disabled:opacity-50"
                                                        disabled={isLoading}
                                                    >
                                                        Resend Code
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSignup} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="Enter your full name"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="Enter your email address"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Staff ID</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="text"
                                                        name="staffId"
                                                        value={formData.staffId}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="GHA-XXXXX"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Mobile Number</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="Enter mobile number"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Date of Birth</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="date"
                                                        name="dob"
                                                        value={formData.dob}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Division</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <select
                                                        name="division"
                                                        value={formData.division}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none"
                                                        required
                                                    >
                                                        <option value="">Select Division</option>
                                                        <option value="Chief Executive">Chief Executive</option>
                                                        <option value="Deputy Executive Admin">Deputy Executive Admin</option>
                                                        <option value="Deputy Executive Dev">Deputy Executive Dev</option>
                                                        <option value="Deputy Executive Mtce">Deputy Executive Mtce</option>
                                                        <option value="Legal Services">Legal Services</option>
                                                        <option value="HR">HR</option>
                                                        <option value="Finance">Finance</option>
                                                        <option value="Public Affairs">Public Affairs</option>
                                                        <option value="Training & Dev">Training & Dev</option>
                                                        <option value="Survey & Design">Survey & Design</option>
                                                        <option value="Bridges">Bridges</option>
                                                        <option value="Road Safety & Environ">Road Safety & Environ</option>
                                                        <option value="Plant & Equipment">Plant & Equipment</option>
                                                        <option value="Quantity Surveying">Quantity Surveying</option>
                                                        <option value="MIS">MIS</option>
                                                        <option value="Road Maintenance">Road Maintenance</option>
                                                        <option value="Planning">Planning</option>
                                                        <option value="Contract">Contract</option>
                                                        <option value="Materials">Materials</option>
                                                        <option value="Audit">Audit</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Position / Role</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="text"
                                                        name="position"
                                                        value={formData.position}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="e.g. Senior Engineer"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-text-secondary ml-1">Confirm Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-bg-dark/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {loginError && (
                                            <div className="text-xs text-red-500 font-semibold px-1">
                                                {loginError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-primary to-primary-light hover:to-primary-dark text-text-primary font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin"></div>
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    Create Account
                                                    <UserPlus size={18} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


            </motion.div>



            {/* Footer Branding - Placed directly on the page surface */}
            <div className="fixed bottom-2 right-10 flex items-center gap-1 z-10 hidden md:flex opacity-90 transition-opacity">
                <div className="text-right select-none pointer-events-none">

                    <p className="text-xs text-text-primary font-black tracking-widest uppercase">Asset Management System</p>
                    <p className="text-[11px] text-text-muted uppercase font-black tracking-[0.25em] leading-tight mb-1">GHA |Head Office, Accra</p>
                </div>
                <div className="h-24 w-auto transition-transform duration-700">
                    <img
                        src="/coat_of_arms.jpg"
                        alt="Coat of Arms"
                        className="h-full object-contain filter contrast-125 brightness-110 grayscale-0"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
