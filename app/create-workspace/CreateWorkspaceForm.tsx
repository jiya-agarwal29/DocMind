"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CreateWorkspaceSchema } from "@/lib/validation/schemas";

export function CreateWorkspaceForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = CreateWorkspaceSchema.shape.name.safeParse(name);
        if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: parsed.data }),
            });

            if (response.status === 201) {
                router.push("/dashboard");
                return;
            }

            setError("Something went wrong creating your workspace. Please try again.");
        } catch {
            setError("Something went wrong creating your workspace. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="name"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    Workspace name
                </label>
                <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                />
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Creating workspace..." : "Create workspace"}
            </button>
        </form>
    );
}
