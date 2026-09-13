import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Folder, Document } from "@/lib/db/models";
import { requireWorkspaceMember, requireWorkspaceEditor } from "@/lib/auth/guards";
import { RenameFolderSchema } from "@/lib/validation/schemas";

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

    return NextResponse.json({
        folder: {
            id: folder._id.toString(),
            name: folder.name,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
        },
    });
}

export async function PATCH(
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

    const body = await request.json().catch(() => null);
    const parsed = RenameFolderSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const { name } = parsed.data;

    const folder = await Folder.findOne({ _id: folderId, workspaceId });
    if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const duplicate = await Folder.findOne({
        _id: { $ne: folderId },
        workspaceId,
        name,
    });
    if (duplicate) {
        return NextResponse.json(
            { error: "A folder with that name already exists in this workspace." },
            { status: 409 }
        );
    }

    folder.name = name;
    await folder.save();

    return NextResponse.json({
        folder: {
            id: folder._id.toString(),
            name: folder.name,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
        },
    });
}

export async function DELETE(
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

    const documentCount = await Document.countDocuments({
        workspaceId,
        folderId,
    });
    if (documentCount > 0) {
        return NextResponse.json(
            {
                error:
                    "This folder still has documents in it. Move or delete them first.",
            },
            { status: 409 }
        );
    }

    await folder.deleteOne();

    return NextResponse.json({ ok: true });
}
