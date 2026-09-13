import type { MembershipRole } from "@/lib/auth/getMembership";

const ROLE_LABELS: Record<MembershipRole, string> = {
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
};

const ROLE_STYLES: Record<MembershipRole, string> = {
    admin: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    editor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    viewer: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function RoleBadge({
    role,
    className = "",
}: {
    role: MembershipRole;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role]} ${className}`}
        >
            {ROLE_LABELS[role]}
        </span>
    );
}
