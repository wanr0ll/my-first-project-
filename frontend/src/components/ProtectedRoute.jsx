import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show a full-screen loader while the app is verifying the auth token
    // This prevents the "flash to login" flicker on page reload
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--bg-dark))]">
                <div className="h-14 w-14 bg-gradient-to-tr from-primary to-primary-light rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-primary/30 animate-pulse">
                    <span className="text-2xl font-bold text-white">G</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-4">Authenticating...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
