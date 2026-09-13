import { Skeleton } from "@/components/Skeleton";

export default function WorkspaceLoading() {
    return (
        <div className="flex flex-1">
            <aside className="flex w-[260px] shrink-0 flex-col border-r border-black/[.08] bg-zinc-50 px-3.5 py-5 dark:border-white/[.08] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5 px-2 py-2">
                    <Skeleton className="h-[26px] w-[26px] shrink-0 rounded-[7px]" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="mt-3 h-9 w-full rounded-lg" />
                <div className="my-4 h-px bg-black/[.08] dark:bg-white/[.08]" />
                <Skeleton className="ml-2.5 h-3 w-14" />
                <div className="mt-3 flex flex-col gap-2">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2.5 border-t border-black/[.08] pt-3.5 dark:border-white/[.08]">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </aside>

            <main className="min-w-0 flex-1 bg-white px-8 py-10 dark:bg-zinc-900">
                <div className="mx-auto w-full max-w-3xl">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-7 w-56" />
                    <Skeleton className="mt-10 h-3 w-32" />
                    <div className="mt-3 flex flex-col gap-2">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                </div>
            </main>
        </div>
    );
}
