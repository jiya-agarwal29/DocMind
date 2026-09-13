"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, Folder, LogOut, Users } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import type { MembershipRole } from "@/lib/auth/getMembership";

type FolderNavItem = {
    id: string;
    name: string;
    documentCount: number;
};

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar({
    workspaceId,
    workspaceName,
    folders,
    role,
    userName,
}: {
    workspaceId: string;
    workspaceName: string;
    folders: FolderNavItem[];
    role: MembershipRole;
    userName: string;
}) {
    const pathname = usePathname();

    const homeHref = `/workspace/${workspaceId}`;
    const teamHref = `/workspace/${workspaceId}/team`;
    const isTeamActive = pathname === teamHref;

    return (
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-black/[.08] bg-zinc-50 px-3.5 py-5 dark:border-white/[.08] dark:bg-zinc-950">
            <div className="flex items-center gap-1">
                <Link
                    href={homeHref}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                >
                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-indigo-600 text-xs font-semibold text-white dark:bg-indigo-500">
                        {workspaceName.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {workspaceName}
                    </span>
                </Link>
                <Link
                    href="/dashboard"
                    title="Switch workspace"
                    className="group shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-black/[.04] hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[.06] dark:hover:text-zinc-300"
                >
                    <ChevronDown
                        size={14}
                        strokeWidth={2}
                        className="transition-transform duration-200 group-hover:translate-y-0.5"
                    />
                </Link>
            </div>

            <Link
                href={teamHref}
                className={`mt-3 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    isTeamActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
                }`}
            >
                <Users size={16} strokeWidth={2} />
                <span>Team</span>
            </Link>

            <div className="my-4 h-px bg-black/[.08] dark:bg-white/[.08]" />

            <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Folders
            </div>
            <nav className="flex flex-col gap-0.5">
                {folders.length === 0 ? (
                    <p className="px-2.5 py-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                        No folders yet
                    </p>
                ) : (
                    folders.map((folder, i) => {
                        const href = `/workspace/${workspaceId}/folders/${folder.id}`;
                        const active = pathname === href;
                        return (
                            <Link
                                key={folder.id}
                                href={href}
                                style={{ animationDelay: `${i * 30}ms` }}
                                className={`animate-fade-in-up flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
                                }`}
                            >
                                <Folder
                                    size={15}
                                    strokeWidth={2}
                                    className={`shrink-0 ${
                                        active
                                            ? "text-indigo-500 dark:text-indigo-400"
                                            : "text-zinc-400 dark:text-zinc-500"
                                    }`}
                                />
                                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                                <span
                                    className={`shrink-0 text-xs ${
                                        active
                                            ? "text-indigo-400 dark:text-indigo-400"
                                            : "text-zinc-400 dark:text-zinc-500"
                                    }`}
                                >
                                    {folder.documentCount}
                                </span>
                            </Link>
                        );
                    })
                )}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center justify-between gap-2 border-t border-black/[.08] pt-3.5 dark:border-white/[.08]">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {initials(userName)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {userName}
                        </p>
                        <RoleBadge role={role} className="mt-0.5" />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    title="Log out"
                    className="group shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-black/[.04] hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[.06] dark:hover:text-zinc-300"
                >
                    <LogOut
                        size={15}
                        strokeWidth={2}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                </button>
            </div>
        </aside>
    );
}
