import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { SignupSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    const { email, name, password } = parsed.data;

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json(
            { error: "An account with this email already exists." },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });

    return NextResponse.json(
        { id: user._id.toString(), email: user.email, name: user.name },
        { status: 201 }
    );
}
