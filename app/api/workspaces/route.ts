import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectDB } from "@/lib/db/connect";
import { Workspace, Membership } from "@/lib/db/models";
import { CreateWorkspaceSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = CreateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const { name } = parsed.data;
    const ownerId = session.user.id;

    const dbSession = await mongoose.startSession();

    try {
        let workspace: InstanceType<typeof Workspace> | undefined;

        await dbSession.withTransaction(async () => {
            const [createdWorkspace] = await Workspace.create(
                [{ name, plan: "free", ownerId }],
                { session: dbSession }
            );

            await Membership.create(
                [
                    {
                        userId: ownerId,
                        workspaceId: createdWorkspace._id,
                        role: "admin",
                    },
                ],
                { session: dbSession }
            );

            workspace = createdWorkspace;
        });

        return NextResponse.json(
            { id: workspace!._id.toString(), name: workspace!.name, plan: workspace!.plan },
            { status: 201 }
        );
    } finally {
        await dbSession.endSession();
    }
}
