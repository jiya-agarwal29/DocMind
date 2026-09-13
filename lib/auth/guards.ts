import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getMembership, type MembershipRole } from "@/lib/auth/getMembership";

export type WorkspaceGuardResult =
    | { ok: true; userId: string; email: string | null; role: MembershipRole }
    | { ok: false; status: 400 | 401 | 403; error: string };

/**
 * Resolves the current session's role in THIS specific workspace.
 *
 * Security model: `workspaceId` is caller-supplied (it comes from the request
 * URL), so it is untrusted. We take the requester's identity only from the
 * signed session, then check membership keyed on BOTH userId and workspaceId
 * together. Because a membership row's role is scoped to one workspace, there is
 * no path by which a member of workspace A gets a role back for workspace B.
 *
 *   - no session                      -> 401
 *   - malformed workspaceId           -> 400
 *   - no membership in this workspace -> 403
 *   - membership found                -> ok, with that role attached
 *
 * Role-specific access (admin-only, editor-or-admin, any member) is enforced
 * by the wrappers below, not here.
 */
async function resolveWorkspaceRole(
    workspaceId: string
): Promise<WorkspaceGuardResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
        return { ok: false, status: 400, error: "Invalid workspace id" };
    }

    const role = await getMembership(session.user.id, workspaceId);
    if (!role) {
        return {
            ok: false,
            status: 403,
            error: "You are not a member of this workspace.",
        };
    }

    return {
        ok: true,
        userId: session.user.id,
        email: session.user.email ?? null,
        role,
    };
}

/**
 * Confirms the current session belongs to an admin of THIS workspace.
 * Use for workspace/team management (invites, roles, workspace settings).
 */
export async function requireWorkspaceAdmin(
    workspaceId: string
): Promise<WorkspaceGuardResult> {
    const result = await resolveWorkspaceRole(workspaceId);
    if (!result.ok) return result;

    if (result.role !== "admin") {
        return {
            ok: false,
            status: 403,
            error: "You must be an admin of this workspace to do that.",
        };
    }

    return result;
}

/**
 * Confirms the current session is an editor or admin of THIS workspace.
 * Use for writes: creating/renaming/deleting folders and documents.
 */
export async function requireWorkspaceEditor(
    workspaceId: string
): Promise<WorkspaceGuardResult> {
    const result = await resolveWorkspaceRole(workspaceId);
    if (!result.ok) return result;

    if (result.role !== "admin" && result.role !== "editor") {
        return {
            ok: false,
            status: 403,
            error: "You must be an editor or admin of this workspace to do that.",
        };
    }

    return result;
}

/**
 * Confirms the current session has ANY membership in THIS workspace.
 * Use for reads: viewing/listing folders and documents.
 */
export async function requireWorkspaceMember(
    workspaceId: string
): Promise<WorkspaceGuardResult> {
    return resolveWorkspaceRole(workspaceId);
}
