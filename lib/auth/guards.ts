import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getMembership } from "@/lib/auth/getMembership";

export type WorkspaceAdminGuardResult =
    | { ok: true; userId: string; email: string | null }
    | { ok: false; status: 400 | 401 | 403; error: string };

/**
 * Confirms the current session belongs to an admin of THIS specific workspace.
 *
 * Security model: `workspaceId` is caller-supplied (it comes from the request
 * URL), so it is untrusted. We take the requester's identity only from the
 * signed session, then check membership keyed on BOTH userId and workspaceId
 * together. Because a membership row's role is scoped to one workspace, there is
 * no path by which an admin of workspace A gets `"admin"` back for workspace B.
 *
 *   - no session                      -> 401
 *   - malformed workspaceId           -> 400
 *   - no membership in this workspace -> 403
 *   - membership but role !== admin   -> 403
 *   - admin of this workspace         -> ok
 */
export async function requireWorkspaceAdmin(
    workspaceId: string
): Promise<WorkspaceAdminGuardResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
        return { ok: false, status: 400, error: "Invalid workspace id" };
    }

    const role = await getMembership(session.user.id, workspaceId);
    if (role !== "admin") {
        return {
            ok: false,
            status: 403,
            error: "You must be an admin of this workspace to do that.",
        };
    }

    return {
        ok: true,
        userId: session.user.id,
        email: session.user.email ?? null,
    };
}
