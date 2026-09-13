import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Folder } from "@/lib/db/models";
import { requireWorkspaceMember, requireWorkspaceEditor } from "@/lib/auth/guards";
import { CreateFolderSchema } from "@/lib/validation/schemas";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { workspaceId } = await params;

    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    await connectDB();

    const folders = await Folder.find({ workspaceId }).sort({ name: 1 });

    return NextResponse.json({
        folders: folders.map((folder) => ({
            id: folder._id.toString(),
            name: folder.name,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
        })),
    });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { workspaceId } = await params;

    const guard = await requireWorkspaceEditor(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = CreateFolderSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const { name } = parsed.data;

    const existing = await Folder.findOne({ workspaceId, name });
    if (existing) {
        return NextResponse.json(
            { error: "A folder with that name already exists in this workspace." },
            { status: 409 }
        );
    }

    const folder = await Folder.create({
        workspaceId,
        name,
        createdBy: guard.userId,
    });

    return NextResponse.json(
        {
            folder: {
                id: folder._id.toString(),
                name: folder.name,
                createdAt: folder.createdAt.toISOString(),
                updatedAt: folder.updatedAt.toISOString(),
            },
        },
        { status: 201 }
    );
}
