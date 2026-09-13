import type { ReactNode } from "react";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Workspace, Folder, Document } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Sidebar } from "./Sidebar";

async function loadSidebarData(workspaceId: string) {
    await connectDB();

    const workspace = await Workspace.findById(workspaceId).select("name").lean();
    const folders = await Folder.find({ workspaceId }).sort({ name: 1 }).lean();

    const counts = await Document.aggregate([
        { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
        { $group: { _id: "$folderId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

    return {
        workspaceName: workspace?.name ?? "Workspace",
        folders: folders.map((f) => ({
            id: f._id.toString(),
            name: f.name as string,
            documentCount: countMap.get(f._id.toString()) ?? 0,
        })),
    };
}

export default async function WorkspaceLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        if (guard.status === 401) redirect("/login");
        return (
            <div className="flex flex-1">
                <NotAuthorized message="You are not a member of this workspace." />
            </div>
        );
    }

    const { workspaceName, folders } = await loadSidebarData(workspaceId);

    return (
        <div className="flex flex-1">
            <Sidebar
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                folders={folders}
                role={guard.role}
                userName={session.user.name ?? "Member"}
            />
            <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
                {children}
            </main>
        </div>
    );
}
