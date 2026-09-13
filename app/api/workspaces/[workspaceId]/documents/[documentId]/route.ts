import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Folder, Document } from "@/lib/db/models";
import { requireWorkspaceMember, requireWorkspaceEditor } from "@/lib/auth/guards";
import { UpdateDocumentSchema } from "@/lib/validation/schemas";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; documentId: string }> }
) {
    const { workspaceId, documentId } = await params;

    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    if (!mongoose.isValidObjectId(documentId)) {
        return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    await connectDB();

    const document = await Document.findOne({ _id: documentId, workspaceId });
    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
        document: {
            id: document._id.toString(),
            title: document.title,
            content: document.content,
            folderId: document.folderId.toString(),
            createdAt: document.createdAt.toISOString(),
            updatedAt: document.updatedAt.toISOString(),
        },
    });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; documentId: string }> }
) {
    const { workspaceId, documentId } = await params;

    const guard = await requireWorkspaceEditor(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    if (!mongoose.isValidObjectId(documentId)) {
        return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const document = await Document.findOne({ _id: documentId, workspaceId });
    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { title, content, folderId } = parsed.data;

    if (folderId !== undefined) {
        if (!mongoose.isValidObjectId(folderId)) {
            return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
        }
        const targetFolder = await Folder.findOne({ _id: folderId, workspaceId });
        if (!targetFolder) {
            return NextResponse.json(
                { error: "Target folder not found in this workspace." },
                { status: 404 }
            );
        }
        document.folderId = targetFolder._id;
    }

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;

    await document.save();

    return NextResponse.json({
        document: {
            id: document._id.toString(),
            title: document.title,
            content: document.content,
            folderId: document.folderId.toString(),
            createdAt: document.createdAt.toISOString(),
            updatedAt: document.updatedAt.toISOString(),
        },
    });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; documentId: string }> }
) {
    const { workspaceId, documentId } = await params;

    const guard = await requireWorkspaceEditor(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    if (!mongoose.isValidObjectId(documentId)) {
        return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    await connectDB();

    const document = await Document.findOne({ _id: documentId, workspaceId });
    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await document.deleteOne();

    return NextResponse.json({ ok: true });
}
