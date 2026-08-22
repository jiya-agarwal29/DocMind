"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (!result || result.error) {
                setError("Invalid email or password. Please try again.");
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    Log in
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Welcome back to DocMind.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
                            className="rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-white/[.15] dark:text-zinc-50"
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
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {isSubmitting ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
