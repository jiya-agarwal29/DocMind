import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { getMembership } from "@/lib/auth/getMembership";
import { connectDB } from "@/lib/db/connect";
import { User, Membership, Invite } from "@/lib/db/models";
import { InviteMemberForm } from "./InviteMemberForm";

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
};

async function loadTeam(workspaceId: string) {
    await connectDB();

    // Every query below is scoped by workspaceId.
    const memberships = await Membership.find({ workspaceId })
        .sort({ createdAt: 1 })
        .lean();

    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
        .select("name email")
        .lean();
    const userMap = new Map(
        users.map((u) => [u._id.toString(), u as { name: string; email: string }])
    );

    const pendingInvites = await Invite.find({
        workspaceId,
        status: "pending",
    })
        .sort({ createdAt: -1 })
        .lean();

    const now = Date.now();

    return {
        members: memberships.map((m) => {
            const u = userMap.get(m.userId.toString());
            return {
                id: m._id.toString(),
                name: u?.name ?? "Unknown user",
                email: u?.email ?? "—",
                role: m.role as string,
            };
        }),
        invites: pendingInvites.map((inv) => ({
            id: inv._id.toString(),
            email: inv.email as string,
            role: inv.role as string,
            expiresAt: new Date(inv.expiresAt).toLocaleDateString(),
            expired: new Date(inv.expiresAt).getTime() < now,
        })),
    };
}

function NotAuthorized() {
    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    You don&apos;t have access
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Only admins of this workspace can manage the team.
                </p>
            </div>
        </div>
    );
}

export default async function TeamPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
        return <NotAuthorized />;
    }

    // Authorization: admin of THIS workspace only.
    const role = await getMembership(session.user.id, workspaceId);
    if (role !== "admin") {
        return <NotAuthorized />;
    }

    const { members, invites } = await loadTeam(workspaceId);

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-12">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Team
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage who has access to this workspace.
            </p>

            <section className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Members
                </h2>
                <ul className="mt-3 divide-y divide-black/[.06] rounded-lg border border-black/[.08] dark:divide-white/[.06] dark:border-white/[.145]">
                    {members.map((m) => (
                        <li
                            key={m.id}
                            className="flex items-center justify-between px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                    {m.name}
                                </p>
                                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                    {m.email}
                                </p>
                            </div>
                            <span className="ml-4 shrink-0 rounded-full bg-black/[.06] px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                                {ROLE_LABELS[m.role] ?? m.role}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Pending invites
                </h2>
                {invites.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        No pending invites.
                    </p>
                ) : (
                    <ul className="mt-3 divide-y divide-black/[.06] rounded-lg border border-black/[.08] dark:divide-white/[.06] dark:border-white/[.145]">
                        {invites.map((inv) => (
                            <li
                                key={inv.id}
                                className="flex items-center justify-between px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                        {inv.email}
                                    </p>
                                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                        {inv.expired
                                            ? "Expired"
                                            : `Expires ${inv.expiresAt}`}
                                    </p>
                                </div>
                                <span className="ml-4 shrink-0 rounded-full bg-black/[.06] px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                                    {ROLE_LABELS[inv.role] ?? inv.role}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Invite a new member
                </h2>
                <InviteMemberForm workspaceId={workspaceId} />
            </section>
        </div>
    );
}
