import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { authOptions } from "@/lib/auth/authOptions";
import { getUserMemberships } from "@/lib/auth/getMembership";
import { RoleBadge } from "@/components/RoleBadge";

const PLAN_LABELS: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    const memberships = await getUserMemberships(session.user.id);

    if (memberships.length === 0) {
        redirect("/create-workspace");
    }

    if (memberships.length === 1) {
        redirect(`/workspace/${memberships[0].workspaceId}`);
    }

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-2xl px-4 py-12">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Your workspaces
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Choose a workspace to continue.
            </p>

            <ul className="mt-8 flex flex-col gap-2">
                {memberships.map((m, i) => (
                    <li
                        key={m.workspaceId}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                    >
                        <Link
                            href={`/workspace/${m.workspaceId}`}
                            className="flex items-center justify-between gap-4 rounded-lg border border-black/[.08] bg-white px-4 py-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-md dark:border-white/[.1] dark:bg-zinc-900 dark:hover:border-white/[.2]"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white dark:bg-indigo-500">
                                    {m.workspaceName.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                        {m.workspaceName}
                                    </p>
                                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                        {PLAN_LABELS[m.plan] ?? m.plan}
                                    </p>
                                </div>
                            </div>
                            <RoleBadge role={m.role} className="ml-4 shrink-0" />
                        </Link>
                    </li>
                ))}
            </ul>

            <Link
                href="/create-workspace"
                className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-full border border-indigo-200 text-sm font-medium text-indigo-700 transition-all duration-150 hover:bg-indigo-50 hover:shadow-sm active:scale-[0.98] dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
                <Plus size={15} strokeWidth={2.5} />
                Create new workspace
            </Link>
        </div>
    );
}
