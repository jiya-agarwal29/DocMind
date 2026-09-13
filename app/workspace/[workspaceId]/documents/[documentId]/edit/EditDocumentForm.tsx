"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export function EditDocumentForm({
    workspaceId,
    documentId,
    initialTitle,
    initialContent,
}: {
    workspaceId: string;
    documentId: string;
    initialTitle: string;
    initialContent: string;
}) {
    const router = useRouter();
    const { showToast } = useToast();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (title.trim().length === 0) {
            setError("Title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `/api/workspaces/${workspaceId}/documents/${documentId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content }),
                }
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Couldn't save the document. Please try again.");
                return;
            }

            showToast("Document saved");
            router.push(`/workspace/${workspaceId}/documents/${documentId}`);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="title"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    Title
                </label>
                <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="content"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    Content (Markdown)
                </label>
                <textarea
                    id="content"
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 font-mono text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                />
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    {isSubmitting ? "Saving..." : "Save"}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            `/workspace/${workspaceId}/documents/${documentId}`
                        )
                    }
                    className="flex h-10 items-center justify-center px-3 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
