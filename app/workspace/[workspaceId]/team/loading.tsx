import { Skeleton } from "@/components/Skeleton";

export default function TeamLoading() {
    return (
        <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-72" />

            <Skeleton className="mt-10 h-3 w-20" />
            <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
            </div>

            <Skeleton className="mt-10 h-3 w-32" />
            <Skeleton className="mt-3 h-4 w-40" />

            <Skeleton className="mt-10 h-3 w-40" />
            <div className="mt-3 flex flex-col gap-4">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
        </div>
    );
}
