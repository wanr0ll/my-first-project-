import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const icons = {
        success: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <CheckCircle size={20} />
            </div>
        ),
        error: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <AlertCircle size={20} />
            </div>
        ),
        info: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Info size={20} />
            </div>
        ),
    };

    const borders = {
        success: 'border-emerald-500/20',
        error: 'border-rose-500/20',
        info: 'border-blue-500/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-4 bg-[#0f172a]/95 backdrop-blur-2xl border ${borders[type] || borders.info} p-3.5 pr-4 rounded-2xl shadow-2xl min-w-[320px] max-w-md overflow-hidden relative group`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex-shrink-0 relative z-10">
                {icons[type] || icons.info}
            </div>
            
            <div className="flex-1 relative z-10">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${type === 'success' ? 'text-emerald-500' : type === 'error' ? 'text-rose-500' : 'text-blue-500'}`}>
                    {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification'}
                </h4>
                <p className="text-[13px] font-medium text-slate-200 leading-tight">{message}</p>
            </div>
            
            <button 
                onClick={onClose} 
                className="relative z-10 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 active:scale-90"
            >
                <X size={16} strokeWidth={2.5} />
            </button>
        </motion.div>
    );
};
