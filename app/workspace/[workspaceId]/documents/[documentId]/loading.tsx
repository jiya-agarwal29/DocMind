import { Skeleton } from "@/components/Skeleton";

export default function DocumentViewerLoading() {
    return (
        <div className="mx-auto w-full max-w-3xl px-8 py-10">
            <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-16 rounded-full" />
            </div>

            <Skeleton className="mt-4 h-7 w-64" />

            <div className="mt-8 flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}
