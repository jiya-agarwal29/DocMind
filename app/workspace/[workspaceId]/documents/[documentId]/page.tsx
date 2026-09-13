import mongoose from "mongoose";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Document, Folder } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";

export default async function DocumentViewerPage({
    params,
}: {
    params: Promise<{ workspaceId: string; documentId: string }>;
}) {
    const { workspaceId, documentId } = await params;

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

    if (!mongoose.isValidObjectId(documentId)) {
        return <NotAuthorized message="This document doesn't exist." />;
    }

    await connectDB();

    const document = await Document.findOne({
        _id: documentId,
        workspaceId,
    }).lean();
    if (!document) {
        return <NotAuthorized message="This document doesn't exist." />;
    }

    const folder = await Folder.findOne({ _id: document.folderId, workspaceId })
        .select("name")
        .lean();

    const canWrite = guard.role === "admin" || guard.role === "editor";

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-3xl px-8 py-10">
            <div className="flex items-center justify-between gap-4">
                <Link
                    href={`/workspace/${workspaceId}/folders/${document.folderId.toString()}`}
                    className="text-xs font-medium text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                    ← {folder?.name ?? "Folder"}
                </Link>
                {canWrite && (
                    <Link
                        href={`/workspace/${workspaceId}/documents/${documentId}/edit`}
                        className="group flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition-all duration-150 hover:bg-indigo-50 hover:shadow-sm active:scale-[0.98] dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                    >
                        <Pencil
                            size={14}
                            strokeWidth={2}
                            className="transition-transform duration-200 group-hover:-rotate-12"
                        />
                        Edit
                    </Link>
                )}
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {document.title}
            </h1>

            <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
                {document.content ? (
                    <ReactMarkdown>{document.content}</ReactMarkdown>
                ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">
                        This document is empty.
                    </p>
                )}
            </div>
        </div>
    );
}
