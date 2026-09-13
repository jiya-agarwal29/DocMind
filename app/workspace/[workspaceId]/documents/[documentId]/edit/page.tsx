import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { requireWorkspaceEditor } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Document } from "@/lib/db/models";
import { NotAuthorized } from "@/components/NotAuthorized";
import { EditDocumentForm } from "./EditDocumentForm";

export default async function DocumentEditPage({
    params,
}: {
    params: Promise<{ workspaceId: string; documentId: string }>;
}) {
    const { workspaceId, documentId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Editor/admin only — viewers see the same "no access" treatment as the
    // admin-only team page, rather than being redirected.
    const guard = await requireWorkspaceEditor(workspaceId);
    if (!guard.ok) {
        if (guard.status === 401) redirect("/login");
        return (
            <NotAuthorized message="You must be an editor or admin of this workspace to edit documents." />
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

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-3xl px-8 py-10">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Edit document
            </h1>

            <EditDocumentForm
                workspaceId={workspaceId}
                documentId={documentId}
                initialTitle={document.title}
                initialContent={document.content}
            />
        </div>
    );
}
