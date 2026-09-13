import { connectDB } from "@/lib/db/connect";
import { Membership, Workspace } from "@/lib/db/models";
import type { IMembership } from "@/lib/db/models";

export type MembershipRole = "admin" | "editor" | "viewer";

export type WorkspaceMembership = {
    workspaceId: string;
    workspaceName: string;
    plan: string;
    role: MembershipRole;
};

export async function getMembership(
    userId: string,
    workspaceId: string
): Promise<MembershipRole | null> {
    await connectDB();

    const membership = await Membership.findOne({ userId, workspaceId });
    if (!membership) return null;

    return membership.role as MembershipRole;
}

export async function getUserMembership(
    userId: string
): Promise<IMembership | null> {
    await connectDB();

    return Membership.findOne({ userId });
}

// All workspaces this user belongs to, for the dashboard workspace-switcher.
export async function getUserMemberships(
    userId: string
): Promise<WorkspaceMembership[]> {
    await connectDB();

    const memberships = await Membership.find({ userId }).lean();
    if (memberships.length === 0) return [];

    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } })
        .select("name plan")
        .lean();
    const workspaceMap = new Map(
        workspaces.map((w) => [w._id.toString(), w as { name: string; plan: string }])
    );

    return memberships
        .map((m) => {
            const workspace = workspaceMap.get(m.workspaceId.toString());
            return {
                workspaceId: m.workspaceId.toString(),
                workspaceName: workspace?.name ?? "Unknown workspace",
                plan: workspace?.plan ?? "free",
                role: m.role as MembershipRole,
            };
        })
        .sort((a, b) => a.workspaceName.localeCompare(b.workspaceName));
}
