import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/guards";
import { AskQuestionSchema } from "@/lib/validation/schemas";
import { searchWorkspace } from "@/lib/rag/search";
import { GenerationTimeoutError } from "@/lib/rag/generateAnswer";
import { checkRateLimit } from "@/lib/rateLimits";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { workspaceId } = await params;

    // Any role may use AI search (admin/editor/viewer) — same as reading docs.
    const guard = await requireWorkspaceMember(workspaceId);
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    // Checked before any Voyage/LLM work so a blocked request costs nothing.
    const rate = checkRateLimit(guard.userId);
    if (!rate.allowed) {
        return NextResponse.json(
            {
                error: `You've reached the search limit. Please try again in ${rate.retryAfterSeconds} seconds.`,
            },
            {
                status: 429,
                headers: { "Retry-After": String(rate.retryAfterSeconds) },
            }
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = AskQuestionSchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue.message, field: issue.path[0] },
            { status: 400 }
        );
    }

    try {
        const result = await searchWorkspace(workspaceId, parsed.data.question);
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof GenerationTimeoutError) {
            return NextResponse.json({ error: err.message }, { status: 504 });
        }
        console.error("AI search failed:", err);
        return NextResponse.json(
            { error: "Search failed. Please try again in a moment." },
            { status: 502 }
        );
    }
}
