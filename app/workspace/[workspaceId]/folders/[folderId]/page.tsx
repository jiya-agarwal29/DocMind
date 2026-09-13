import mongoose from "mongoose";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Inbox } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Folder, Document } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";
import { CreateDocumentForm } from "./CreateDocumentForm";

export default async function FolderDetailPage({
    params,
}: {
    params: Promise<{ workspaceId: string; folderId: string }>;
}) {
    const { workspaceId, folderId } = await params;

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

    if (!mongoose.isValidObjectId(folderId)) {
        return <NotAuthorized message="This folder doesn't exist." />;
    }

    await connectDB();

    const folder = await Folder.findOne({ _id: folderId, workspaceId }).lean();
    if (!folder) {
        return <NotAuthorized message="This folder doesn't exist." />;
    }

    const documents = await Document.find({ workspaceId, folderId })
        .sort({ title: 1 })
        .lean();

    const canWrite = guard.role === "admin" || guard.role === "editor";

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-2xl px-8 py-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        Folder
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                        {folder.name}
                    </h1>
                </div>
                {canWrite && (
                    <CreateDocumentForm workspaceId={workspaceId} folderId={folderId} />
                )}
            </div>

            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Documents
            </h2>

            {documents.length === 0 ? (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/[.1] py-10 text-center dark:border-white/[.145]">
                    <Inbox size={20} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-500" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No documents in this folder yet.
                    </p>
                </div>
            ) : (
                <ul className="mt-3 flex flex-col gap-2">
                    {documents.map((doc, i) => (
                        <li
                            key={doc._id.toString()}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <Link
                                href={`/workspace/${workspaceId}/documents/${doc._id.toString()}`}
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
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
