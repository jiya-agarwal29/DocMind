import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectDB } from "@/lib/db/connect";
import { Membership, Invite } from "@/lib/db/models";
import { AcceptInviteSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = AcceptInviteSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json({ error: issue.message }, { status: 400 });
    }

    const { token } = parsed.data;

    // The person accepting must be logged in. If not, tell the client where to
    // send them so they can log in / sign up and come back to this same link.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const callbackUrl = `/invite/accept?token=${encodeURIComponent(token)}`;
        return NextResponse.json(
            {
                error: "You need to be logged in to accept this invite.",
                loginUrl: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
            },
            { status: 401 }
        );
    }

    await connectDB();

    const invite = await Invite.findOne({ token });
    if (!invite) {
        return NextResponse.json(
            { error: "This invite link is invalid." },
            { status: 404 }
        );
    }

    if (invite.status === "accepted") {
        return NextResponse.json(
            { error: "This invite has already been accepted." },
            { status: 409 }
        );
    }

    if (invite.status === "expired" || invite.expiresAt.getTime() < Date.now()) {
        if (invite.status !== "expired") {
            invite.status = "expired";
            await invite.save();
        }
        return NextResponse.json(
            { error: "This invite has expired. Ask an admin to send a new one." },
            { status: 410 }
        );
    }

    // Bind the invite to the address it was sent to: a leaked link cannot be
    // claimed by a different account.
    const sessionEmail = (session.user.email ?? "").toLowerCase().trim();
    if (sessionEmail !== invite.email) {
        return NextResponse.json(
            { error: "This invite was sent to a different email address." },
            { status: 403 }
        );
    }

    const userId = session.user.id;
    const workspaceId = invite.workspaceId.toString();

    const dbSession = await mongoose.startSession();
    try {
        let applied = false;

        await dbSession.withTransaction(async () => {
            // Idempotent: the unique { userId, workspaceId } index means a
            // double-accept can't create a second membership.
            await Membership.updateOne(
                { userId, workspaceId: invite.workspaceId },
                { $setOnInsert: { role: invite.role } },
                { upsert: true, session: dbSession }
            );

            // Guard on status: of two concurrent accepts, only one flips it.
            const res = await Invite.updateOne(
                { _id: invite._id, status: "pending" },
                {
                    status: "accepted",
                    acceptedBy: userId,
                    acceptedAt: new Date(),
                },
                { session: dbSession }
            );
            applied = res.modifiedCount === 1;
        });

        if (!applied) {
            return NextResponse.json(
                { error: "This invite has already been accepted." },
                { status: 409 }
            );
        }

        return NextResponse.json({ ok: true, workspaceId }, { status: 200 });
    } finally {
        await dbSession.endSession();
    }
}
