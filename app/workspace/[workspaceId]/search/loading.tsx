import { Skeleton } from "@/components/Skeleton";

export default function AISearchLoading() {
    return (
        <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <div className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 rounded-[8px]" />
                <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="mt-2 h-4 w-80" />
            <Skeleton className="mt-6 h-12 w-full rounded-full" />
        </div>
    );
}
