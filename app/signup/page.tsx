"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { SignupSchema } from "@/lib/validation/schemas";

const FIELD_ERROR_MESSAGES: Record<string, string> = {
    email: "Please enter a valid email address.",
    name: "Name must be at least 2 characters.",
    password: "Password must be at least 8 characters.",
};

// Only follow a callbackUrl that points somewhere inside this app — never an
// absolute or protocol-relative URL, which would be an open redirect.
function safeInternalPath(raw: string | null): string | null {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
}

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupForm />
        </Suspense>
    );
}

function SignupForm() {
    const router = useRouter();
    const callbackUrl = safeInternalPath(
        useSearchParams().get("callbackUrl")
    );
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = SignupSchema.safeParse({ email, name, password });
        if (!parsed.success) {
            const field = parsed.error.issues[0].path[0] as string;
            setError(
                FIELD_ERROR_MESSAGES[field] ??
                    "Please check your input and try again."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });

            if (res.status === 409) {
                setError(
                    "An account with this email already exists. Try logging in instead."
                );
                return;
            }

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const field = data?.field as string | undefined;
                setError(
                    (field && FIELD_ERROR_MESSAGES[field]) ??
                        "Something went wrong. Please try again in a moment."
                );
                return;
            }

            setSuccess(true);

            // Establish a session immediately so the user lands on the next
            // step already authenticated.
            await signIn("credentials", {
                email: parsed.data.email,
                password: parsed.data.password,
                redirect: false,
            });

            // If they came from an invite link (?callbackUrl=/invite/accept?...),
            // send them there. Otherwise, normal signup -> set up a workspace.
            setTimeout(() => {
                router.push(callbackUrl ?? "/create-workspace");
            }, 1200);
        } catch {
            setError("Something went wrong. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="animate-fade-in-up w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    Create your account
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Get started with DocMind.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    {success && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                            Account created! Redirecting...
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || success}
                        className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                        {isSubmitting ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
