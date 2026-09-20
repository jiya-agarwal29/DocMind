import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { NotAuthorized } from "@/components/NotAuthorized";
import { AISearchPanel } from "./AISearchPanel";

export default async function AISearchPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    // This only gates whether the page renders — the search API route
    // (requireWorkspaceMember in app/api/workspaces/[workspaceId]/search)
    // re-verifies membership on every request regardless, exactly like the
    // rest of this app's write/read routes.
    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        if (guard.status === 401) redirect("/login");
        return (
            <NotAuthorized message="You are not a member of this workspace." />
        );
    }

    return <AISearchPanel workspaceId={workspaceId} />;
}
