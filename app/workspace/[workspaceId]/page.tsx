import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Inbox } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Workspace, Folder, Document } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";
import { CreateFolderForm } from "./CreateFolderForm";

async function loadWorkspaceHome(workspaceId: string) {
    await connectDB();

    const workspace = await Workspace.findById(workspaceId).select("name").lean();

    const folders = await Folder.find({ workspaceId }).select("name").lean();
    const folderMap = new Map(
        folders.map((f) => [f._id.toString(), f.name as string])
    );

    const recentDocuments = await Document.find({ workspaceId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean();

    return {
        workspaceName: workspace?.name ?? "Workspace",
        recentDocuments: recentDocuments.map((d) => ({
            id: d._id.toString(),
            title: d.title as string,
            folderId: d.folderId.toString(),
            folderName: folderMap.get(d.folderId.toString()) ?? "—",
        })),
    };
}

export default async function WorkspaceHomePage({
    params,
}: {
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
            <NotAuthorized message="You are not a member of this workspace." />
        );
    }

    const { workspaceName, recentDocuments } = await loadWorkspaceHome(workspaceId);

    const canWrite = guard.role === "admin" || guard.role === "editor";

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-3xl px-8 py-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        Workspace
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                        {workspaceName}
                    </h1>
                </div>
                {canWrite && <CreateFolderForm workspaceId={workspaceId} />}
            </div>

            <section className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Recent documents
                </h2>
                {recentDocuments.length === 0 ? (
                    <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/[.1] py-10 text-center dark:border-white/[.145]">
                        <Inbox size={20} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-500" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            No documents yet.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                        {recentDocuments.map((doc, i) => (
                            <li
                                key={doc.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <Link
                                    href={`/workspace/${workspaceId}/documents/${doc.id}`}
                                    className="flex items-center gap-3 rounded-lg border border-black/[.08] bg-white px-4 py-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-md dark:border-white/[.1] dark:bg-zinc-900 dark:hover:border-white/[.2]"
                                >
                                    <FileText
                                        size={16}
                                        strokeWidth={2}
                                        className="shrink-0 text-zinc-400 dark:text-zinc-500"
                                    />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                        {doc.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                                        {doc.folderName}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
