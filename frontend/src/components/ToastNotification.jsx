import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X, TrendingUp, Zap } from "lucide-react";

/**
 * Toast Notification System for real-time workflow updates
 */

// Toast types with their styling
const toastStyles = {
    success: {
        bg: "bg-green-50 border-green-200",
        icon: <CheckCircle className="text-green-500" size={20} />,
        title: "text-green-800",
        message: "text-green-600",
    },
    error: {
        bg: "bg-red-50 border-red-200",
        icon: <XCircle className="text-red-500" size={20} />,
        title: "text-red-800",
        message: "text-red-600",
    },
    warning: {
        bg: "bg-amber-50 border-amber-200",
        icon: <AlertTriangle className="text-amber-500" size={20} />,
        title: "text-amber-800",
        message: "text-amber-600",
    },
    info: {
        bg: "bg-blue-50 border-blue-200",
        icon: <Info className="text-blue-500" size={20} />,
        title: "text-blue-800",
        message: "text-blue-600",
    },
    profit: {
        bg: "bg-emerald-50 border-emerald-200",
        icon: <TrendingUp className="text-emerald-500" size={20} />,
        title: "text-emerald-800",
        message: "text-emerald-600",
    },
    execution: {
        bg: "bg-purple-50 border-purple-200",
        icon: <Zap className="text-purple-500" size={20} />,
        title: "text-purple-800",
        message: "text-purple-600",
    },
};

function Toast({ id, type, title, message, onClose, duration = 5000 }) {
    const [isExiting, setIsExiting] = useState(false);
    const style = toastStyles[type] || toastStyles.info;

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onClose(id), 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div
            className={`${style.bg} border rounded-xl p-4 shadow-lg max-w-sm ${isExiting ? "toast-exit" : "toast-enter"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${style.title}`}>{title}</p>
                    {message && (
                        <p className={`text-xs mt-1 ${style.message}`}>{message}</p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-3">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
}

// Custom hook for managing toasts
export function useToasts() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Convenience methods
    const success = useCallback((title, message) =>
        addToast({ type: "success", title, message }), [addToast]);

    const error = useCallback((title, message) =>
        addToast({ type: "error", title, message }), [addToast]);

    const warning = useCallback((title, message) =>
        addToast({ type: "warning", title, message }), [addToast]);

    const info = useCallback((title, message) =>
        addToast({ type: "info", title, message }), [addToast]);

    const profit = useCallback((title, message) =>
        addToast({ type: "profit", title, message, duration: 8000 }), [addToast]);

    const execution = useCallback((title, message) =>
        addToast({ type: "execution", title, message, duration: 3000 }), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
        profit,
        execution,
    };
}

export default Toast;
