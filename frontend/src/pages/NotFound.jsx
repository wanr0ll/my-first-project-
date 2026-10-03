import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-dark))] relative overflow-hidden p-4">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-danger/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center max-w-2xl"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-danger/10 border-4 border-danger/20 mb-6">
                        <AlertTriangle size={64} className="text-danger" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-8xl font-bold text-white mb-4">404</h1>
                    <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
                    <p className="text-text-secondary text-lg mb-8">
                        Sorry, we couldn't find the page you're looking for. The route may have been moved or doesn't exist.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-bg-card border border-border-color rounded-lg text-white hover:bg-bg-hover transition-all"
                        >
                            <ArrowLeft size={20} />
                            Go Back
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gha-blue-primary text-white rounded-lg hover:bg-gha-blue-dark transition-all shadow-lg"
                        >
                            <Home size={20} />
                            Go to Dashboard
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12"
                >
                    <p className="text-sm text-text-muted">
                        If you believe this is an error, please contact support.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFound;
