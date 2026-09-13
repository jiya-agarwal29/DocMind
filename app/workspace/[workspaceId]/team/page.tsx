import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { getMembership, type MembershipRole } from "@/lib/auth/getMembership";
import { connectDB } from "@/lib/db/connect";
import { User, Membership, Invite } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";
import { RoleBadge } from "@/components/RoleBadge";
import { InviteMemberForm } from "./InviteMemberForm";

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
                role: m.role as MembershipRole,
            };
        }),
        invites: pendingInvites.map((inv) => ({
            id: inv._id.toString(),
            email: inv.email as string,
            role: inv.role as MembershipRole,
            expiresAt: new Date(inv.expiresAt).toLocaleDateString(),
            expired: new Date(inv.expiresAt).getTime() < now,
        })),
    };
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
        return <NotAuthorized message="Only admins of this workspace can manage the team." />;
    }

    // Authorization: admin of THIS workspace only.
    const role = await getMembership(session.user.id, workspaceId);
    if (role !== "admin") {
        return <NotAuthorized message="Only admins of this workspace can manage the team." />;
    }

    const { members, invites } = await loadTeam(workspaceId);

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-2xl px-8 py-10">
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
                            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                    {m.name}
                                </p>
                                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                    {m.email}
                                </p>
                            </div>
                            <RoleBadge role={m.role} className="ml-4 shrink-0" />
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
                                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]"
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
                                <RoleBadge role={inv.role} className="ml-4 shrink-0" />
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
