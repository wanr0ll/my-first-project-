import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import * as API from '../services/api';

/**
 * Decode JWT payload without verification (client-side only, for instant UI restore).
 * The server still verifies the token on every API call.
 */
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        // Check if token is expired client-side
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Instantly restore user from localStorage token (no API delay, no flash)
    const storedToken = localStorage.getItem('auth_token');
    const decodedUser = storedToken ? decodeJWT(storedToken) : null;

    const [isAuthenticated, setIsAuthenticated] = useState(!!decodedUser);
    const [user, setUser] = useState(decodedUser ? {
        id: decodedUser.id,
        name: decodedUser.name,
        email: decodedUser.email,
        role: decodedUser.role,
        division: decodedUser.division,
        permissions: decodedUser.permissions ?? null
    } : null);
    const loading = false; // Instant-restore pattern: no loading flash needed
    const [users, setUsers] = useState([]);
    const { addToast } = useToast();

    const loadUsers = async () => {
        try {
            const response = await API.getUsers(1, 1000);
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    // Background: verify the token with the server and fetch full user profile
    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            try {
                const response = await API.getCurrentUser();
                if (response.success && response.data) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                    
                    // Update last active status silently
                    API.pingUser().catch(e => console.error('Ping failed:', e));
                    
                    if (response.data.role === 'Super Admin') {
                        loadUsers();
                    }
                } else {
                    // Server explicitly rejected — clear everything
                    localStorage.removeItem('auth_token');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Background auth verify failed:', error);
                // On network errors: keep the UI state intact (user stays logged in)
                // Only log out on explicit 401 or 403 suspension
                const msg = error.message?.toLowerCase() || '';
                const isAuthError = msg.includes('unauthorized') || 
                                    msg.includes('invalid or expired token') || 
                                    msg.includes('suspended') || 
                                    msg.includes('deleted') || 
                                    msg.includes('pending');
                if (isAuthError) {
                    localStorage.removeItem('auth_token');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        };

        verifyAuth();

        // Poll every 60 seconds to keep permissions and status updated dynamically
        const intervalId = setInterval(verifyAuth, 60000);
        return () => clearInterval(intervalId);
    }, []);

    // Listen for 401 Unauthorized events from the API client.
    // This avoids hard page reloads (window.location.href) that cause blank screens.
    useEffect(() => {
        const handleUnauthorized = () => {
            localStorage.removeItem('auth_token');
            setUser(null);
            setIsAuthenticated(false);
            // ProtectedRoute will automatically redirect to /login when isAuthenticated = false
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await API.login(email, password);

            if (response.success && response.data) {
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                addToast(`Welcome back, ${userData.name.split(' ')[0]}!`, 'success');

                // Load users if super admin
                if (userData.role === 'Super Admin') {
                    loadUsers();
                }

                return { success: true };
            } else {
                addToast(response.message || 'Login failed', 'error');
                return { success: false, reason: 'invalid_credentials', message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            // Show the specific error from backend (e.g. "pending approval" or "suspended")
            const msg = error.message || 'Login failed';
            addToast(msg, 'error');
            // Determine reason for UI-level handling
            const reason = msg.toLowerCase().includes('verify') ? 'email_unverified'
                : msg.toLowerCase().includes('pending') ? 'pending'
                    : msg.toLowerCase().includes('suspended') ? 'suspended'
                        : 'error';
            return { success: false, reason, message: msg };
        }
    };

    const signup = async (name, email, password, role = 'Worker', division = 'General', extra = {}) => {
        try {
            const response = await API.register(name, email, password, role, division, extra);

            if (response.success) {
                addToast('Account created! Please check your email for a verification code.', 'success');
                // Refresh list if current user is super admin
                if (user && user.role === 'Super Admin') {
                    loadUsers();
                }
                return { success: true };
            } else {
                addToast(response.message || 'Registration failed', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Signup error:', error);
            addToast(error.message || 'Registration failed', 'error');
            return { success: false };
        }
    };

    const verifyEmail = async (email, otp) => {
        try {
            const response = await API.verifyEmail(email, otp);
            if (response.success) {
                addToast('Email verified! Please set your personal password.', 'success');
                return {
                    success: true,
                    set_password_token: response.data?.set_password_token,
                    email: response.data?.email
                };
            } else {
                addToast(response.message || 'Verification failed', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Verification failed', 'error');
            return { success: false };
        }
    };

    const resendVerification = async (email) => {
        try {
            const response = await API.resendVerification(email);
            if (response.success) {
                addToast('A new verification code has been sent.', 'success');
                return { success: true };
            } else {
                addToast(response.message || 'Failed to resend code', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Failed to resend code', 'error');
            return { success: false };
        }
    };

    const setInitialPassword = async (token, password) => {
        try {
            const response = await API.setInitialPassword(token, password);
            if (response.success && response.data) {
                // Backend auto-logs in: save the JWT and set auth state
                if (response.data.token) {
                    localStorage.setItem('auth_token', response.data.token);
                }
                const userData = response.data.user;
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);
                    addToast(`Welcome, ${userData.name.split(' ')[0]}! Your account is now active.`, 'success');
                    if (userData.role === 'Super Admin') loadUsers();
                }
                return { success: true, autoLoggedIn: !!userData };
            } else {
                addToast(response.message || 'Failed to set password', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Failed to set password', 'error');
            return { success: false };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await API.forgotPassword(email);
            if (response.success) {
                addToast(response.message || 'Reset instructions sent.', 'success');
                return { success: true, data: response.data };
            } else {
                addToast(response.message || 'Failed to send reset link', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Failed to send reset link', 'error');
            return { success: false };
        }
    };

    const verifyResetOtp = async (otp) => {
        try {
            const response = await API.verifyResetOtp(otp);
            if (response.success) {
                addToast('OTP verified successfully! Please enter your new password.', 'success');
                return { success: true };
            } else {
                addToast(response.message || 'Invalid or expired OTP', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Verification failed', 'error');
            return { success: false };
        }
    };

    const resetPassword = async (otp, newPassword) => {
        try {
            const response = await API.resetPassword(otp, newPassword);
            if (response.success) {
                addToast('Password has been reset successfully. Please login with your new password.', 'success');
                return { success: true };
            } else {
                addToast(response.message || 'Password reset failed', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Password reset failed', 'error');
            return { success: false };
        }
    };

    const updateUserStatus = async (userId, newStatus) => {
        try {
            const response = await API.updateUser(userId, { status: newStatus });
            if (response.success) {
                addToast(`User status updated to ${newStatus}.`, 'success');
                loadUsers(); // Refresh list
                return { success: true };
            } else {
                addToast(response.message || 'Update failed', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Update failed', 'error');
            return { success: false };
        }
    };

    const updateUser = async (userId, updatedData) => {
        try {
            const response = await API.updateUser(userId, updatedData);
            if (response.success) {
                addToast('User account updated successfully.', 'success');

                // If the updated user is the current user, update the local user state
                if (userId === user?.id) {
                    setUser(prev => ({ ...prev, ...updatedData }));
                }

                loadUsers(); // Refresh list for Super Admins
                return { success: true };
            } else {
                addToast(response.message || 'Update failed', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Update failed', 'error');
            return { success: false };
        }
    };

    const updateProfile = (updatedUser) => {
        setUser(updatedUser);
    };

    const verifyUser = async (userId) => {
        return updateUserStatus(userId, 'active');
    };

    const deleteUser = async (userId) => {
        try {
            const response = await API.deleteUser(userId);
            if (response.success) {
                addToast('User deleted successfully.', 'success');
                loadUsers(); // Refresh list
                return { success: true };
            } else {
                addToast(response.message || 'Delete failed', 'error');
                return { success: false };
            }
        } catch (error) {
            addToast(error.message || 'Delete failed', 'error');
            return { success: false };
        }
    };

    const getCustomPerm = (u, key) => {
        if (!u?.permissions) return null;
        try {
            const p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
            return p[key];
        } catch { return null; }
    };

    // Permission Helpers — Super Admin always bypasses overrides
    const permissions = {
        canViewAssets: () => true, // Everyone can view
        canViewHistory: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canViewHistory');
            if (override === false) return false;
            return true; // Default to true unless explicitly overridden
        },
        canViewDetails: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canViewDetails');
            if (override === false) return false;
            return true; // Default to true unless explicitly overridden
        },
        canAddAsset: (u) => {
            if (u?.role === 'Super Admin') return true; // Super Admin is never restricted
            const override = getCustomPerm(u, 'canAddAsset');
            if (override === false) return false;
            if (override === true) return true;
            return ['CEO', 'Chief Executive', 'Director'].includes(u?.role) && u?.role !== 'Auditor';
        },
        canEditAsset: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canEditAsset');
            if (override === false) return false;
            if (override === true) return true;
            return ['CEO'].includes(u?.role) && u?.role !== 'Auditor';
        },
        canRestoreAsset: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canRestoreAsset');
            if (override === false) return false;
            if (override === true) return true;
            return ['CEO'].includes(u?.role) && u?.role !== 'Auditor';
        },
        canArchiveAsset: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canArchiveAsset');
            if (override === false) return false;
            if (override === true) return true;
            return ['CEO'].includes(u?.role) && u?.role !== 'Auditor';
        },
        canTransferAssets: (u) => {
            if (u?.role === 'Super Admin') return true;
            const override = getCustomPerm(u, 'canTransferAssets');
            if (override === false) return false;
            if (override === true) return true;
            return ['CEO', 'Chief Executive', 'Director'].includes(u?.role) && u?.role !== 'Auditor';
        },
        canCheckOutAssets: (u) => u?.role === 'Super Admin' || (['CEO', 'Chief Executive', 'Director'].includes(u?.role) && u?.role !== 'Auditor'),
        canApproveAsset: (u, asset) => {
            if (u?.role === 'Super Admin') return true;
            if (u?.role === 'Auditor') return false;
            if (['CEO'].includes(u?.role)) return true;
            if (u?.role === 'Chief Executive') {
                return u.division === asset?.division;
            }
            return false;
        },
        canManageProjects: (u) => u?.role === 'Super Admin' || (['CEO', 'Chief Executive', 'Director'].includes(u?.role) && u?.role !== 'Auditor'),
        canScheduleMaintenance: (u) => u?.role === 'Super Admin' || (['CEO', 'Chief Executive', 'Director'].includes(u?.role) && u?.role !== 'Auditor'),
        canManageUsers: (u) => u?.role === 'Super Admin',
        canAssignTasks: (u) => u?.role === 'Super Admin' || (['CEO'].includes(u?.role) && u?.role !== 'Auditor')
    };

    const logout = async () => {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        setIsAuthenticated(false);
        setUsers([]); // Clear users on logout
        localStorage.removeItem('auth_token');
        addToast('Logged out successfully.', 'info');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated, user, users, login, signup, logout,
            verifyUser, updateUserStatus, updateUser, deleteUser,
            verifyEmail, resendVerification, setInitialPassword,
            forgotPassword, verifyResetOtp, resetPassword, loading, permissions, loadUsers,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
