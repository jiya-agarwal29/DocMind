"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { CreateInviteSchema } from "@/lib/validation/schemas";

type Role = "admin" | "editor" | "viewer";

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("viewer");
    const [error, setError] = useState<string | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setInviteUrl(null);
        setCopied(false);

        const parsed = CreateInviteSchema.safeParse({ email, role });
        if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `/api/workspaces/${workspaceId}/invites`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(parsed.data),
                }
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Couldn't create the invite. Please try again.");
                return;
            }

            setInviteUrl(data.inviteUrl ?? null);
            setEmail("");
            setRole("viewer");
            showToast("Invite created");
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function copyLink() {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            showToast("Link copied to clipboard");
        } catch {
            setCopied(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="invite-email"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    Email
                </label>
                <input
                    id="invite-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="invite-role"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    Role
                </label>
                <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                >
                    <option value="viewer">Viewer — read-only</option>
                    <option value="editor">Editor — write/edit docs</option>
                    <option value="admin">Admin — full workspace control</option>
                </select>
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
                {isSubmitting ? "Creating invite..." : "Create invite"}
            </button>

            {inviteUrl && (
                <div className="animate-fade-in-scale mt-2 flex flex-col gap-2 rounded-md border border-black/[.08] bg-zinc-50 p-3 dark:border-white/[.145] dark:bg-zinc-900">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Email sending isn&apos;t wired up yet — share this link with
                        the invitee:
                    </p>
                    <code className="block break-all rounded bg-black/[.06] px-2 py-1 text-xs text-zinc-800 dark:bg-white/[.08] dark:text-zinc-200">
                        {inviteUrl}
                    </code>
                    <button
                        type="button"
                        onClick={copyLink}
                        className={`flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                            copied
                                ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                                : "border-black/[.12] text-zinc-800 hover:bg-black/[.04] dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-white/[.06]"
                        }`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? "Copied" : "Copy link"}
                    </button>
                </div>
            )}
        </form>
    );
}
