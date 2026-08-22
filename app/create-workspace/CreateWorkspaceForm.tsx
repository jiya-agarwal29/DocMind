"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-white/[.15] dark:text-zinc-50"
                />
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
            >
                {isSubmitting ? "Creating workspace..." : "Create workspace"}
            </button>
        </form>
    );
}
