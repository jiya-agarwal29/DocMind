"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { CreateFolderSchema } from "@/lib/validation/schemas";

export function CreateFolderForm({ workspaceId }: { workspaceId: string }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = CreateFolderSchema.shape.name.safeParse(name);
        if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/folders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: parsed.data }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Couldn't create the folder. Please try again.");
                return;
            }

            setName("");
            setIsOpen(false);
            showToast(`Folder "${parsed.data}" created`);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                <Plus
                    size={15}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:rotate-90"
                />
                New folder
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="animate-fade-in-scale flex items-start gap-2"
        >
            <div className="flex flex-col gap-1">
                <input
                    autoFocus
                    type="text"
                    placeholder="Folder name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 rounded-md border border-black/[.12] bg-transparent px-3 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                />
                {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Creating..." : "Create"}
            </button>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setName("");
                }}
                className="flex h-10 items-center justify-center px-3 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
                Cancel
            </button>
        </form>
    );
}
