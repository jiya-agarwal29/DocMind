import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { AcceptInviteClient } from "./AcceptInviteClient";

export default async function AcceptInvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
                <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                    <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                        Invalid invite link
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        This link is missing its invite token. Ask an admin to send
                        you a new one.
                    </p>
                </div>
            </div>
        );
    }

    // Not logged in -> go log in / sign up, then come straight back here.
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        const callbackUrl = `/invite/accept?token=${encodeURIComponent(token)}`;
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    Joining workspace
                </h1>
                <div className="mt-4">
                    <AcceptInviteClient token={token} />
                </div>
            </div>
        </div>
    );
}
