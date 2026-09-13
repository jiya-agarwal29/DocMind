"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

type Toast = {
    id: number;
    message: string;
    variant: ToastVariant;
};

type ToastContextValue = {
    showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-toast-in pointer-events-auto flex items-center gap-2 rounded-lg border border-black/[.08] bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 shadow-lg dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-200"
                    >
                        {toast.variant === "success" ? (
                            <CheckCircle2 size={16} className="shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                            <XCircle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
                        )}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return ctx;
}
