"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "working" | "success" | "error";

export function AcceptInviteClient({ token }: { token: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>("working");
    const [message, setMessage] = useState("Accepting your invite...");
    const ran = useRef(false);

    useEffect(() => {
        // React 18 StrictMode double-invokes effects in dev; accept once.
        if (ran.current) return;
        ran.current = true;

        (async () => {
            try {
                const res = await fetch("/api/invites/accept", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json().catch(() => ({}));

                if (res.status === 401 && data.loginUrl) {
                    router.push(data.loginUrl);
                    return;
                }

                if (!res.ok) {
                    setStatus("error");
                    setMessage(data.error ?? "We couldn't accept this invite.");
                    return;
                }

                setStatus("success");
                setMessage("You're in! Taking you to your dashboard...");
                router.push("/dashboard");
            } catch {
                setStatus("error");
                setMessage("Something went wrong. Please try again in a moment.");
            }
        })();
    }, [token, router]);

    return (
        <div className="flex flex-col gap-3">
            <p
                className={
                    status === "error"
                        ? "text-sm text-red-600 dark:text-red-400"
                        : "text-sm text-zinc-600 dark:text-zinc-400"
                }
            >
                {message}
            </p>
            {status === "error" && (
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex h-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
                    Go to dashboard
                </button>
            )}
        </div>
    );
}
