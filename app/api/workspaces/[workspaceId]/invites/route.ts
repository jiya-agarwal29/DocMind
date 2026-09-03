import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User, Membership, Invite } from "@/lib/db/models";
import { requireWorkspaceAdmin } from "@/lib/auth/guards";
import { CreateInviteSchema } from "@/lib/validation/schemas";

const INVITE_EXPIRY_DAYS = 7;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { workspaceId } = await params;

    // Auth (401) + authorization: admin of THIS workspace only (403).
    const guard = await requireWorkspaceAdmin(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = CreateInviteSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { role } = parsed.data;

    // Already a member of this workspace?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const alreadyMember = await Membership.findOne({
            userId: existingUser._id,
            workspaceId,
        });
        if (alreadyMember) {
            return NextResponse.json(
                { error: "That person is already a member of this workspace." },
                { status: 409 }
            );
        }
    }

    // Already has a pending invite for this workspace?
    const existingInvite = await Invite.findOne({
        workspaceId,
        email,
        status: "pending",
    });
    if (existingInvite) {
        return NextResponse.json(
            { error: "There's already a pending invite for this email." },
            { status: 409 }
        );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
        Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const invite = await Invite.create({
        email,
        workspaceId,
        role,
        invitedBy: guard.userId,
        token,
        status: "pending",
        expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

    return NextResponse.json(
        {
            invite: {
                id: invite._id.toString(),
                email: invite.email,
                role: invite.role,
                status: invite.status,
                expiresAt: invite.expiresAt.toISOString(),
            },
            // No email is sent yet — use this link to accept the invite manually.
            inviteUrl,
        },
        { status: 201 }
    );
}
