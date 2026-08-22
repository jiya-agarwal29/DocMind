import { connectDB } from "@/lib/db/connect";
import { Membership } from "@/lib/db/models";
import type { IMembership } from "@/lib/db/models";

export type MembershipRole = "admin" | "editor" | "viewer";

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
