import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Folder, Document } from "@/lib/db/models";
import { requireWorkspaceMember, requireWorkspaceEditor } from "@/lib/auth/guards";
import { CreateDocumentSchema } from "@/lib/validation/schemas";
import { indexDocument } from "@/lib/rag/indexDocument";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
    const { workspaceId, folderId } = await params;

    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    if (!mongoose.isValidObjectId(folderId)) {
        return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
    }

    await connectDB();

    const folder = await Folder.findOne({ _id: folderId, workspaceId });
    if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const documents = await Document.find({ workspaceId, folderId }).sort({
        title: 1,
    });

    return NextResponse.json({
        documents: documents.map((doc) => ({
            id: doc._id.toString(),
            title: doc.title,
            folderId: doc.folderId.toString(),
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
        })),
    });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
    const { workspaceId, folderId } = await params;

    const guard = await requireWorkspaceEditor(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    if (!mongoose.isValidObjectId(folderId)) {
        return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
    }

    await connectDB();

    const folder = await Folder.findOne({ _id: folderId, workspaceId });
    if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = CreateDocumentSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const { title, content } = parsed.data;

    const document = await Document.create({
        workspaceId,
        folderId,
        title,
        content,
        createdBy: guard.userId,
    });

    // Best-effort: search indexing must never block the document save.
    indexDocument(document).catch((err) => {
        console.error("Failed to index document for search:", err);
    });

    return NextResponse.json(
        {
            document: {
                id: document._id.toString(),
                title: document.title,
                content: document.content,
                folderId: document.folderId.toString(),
                createdAt: document.createdAt.toISOString(),
                updatedAt: document.updatedAt.toISOString(),
            },
        },
        { status: 201 }
    );
}
