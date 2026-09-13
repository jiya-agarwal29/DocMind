import { Skeleton } from "@/components/Skeleton";

export default function DocumentEditLoading() {
    return (
        <div className="mx-auto w-full max-w-3xl px-8 py-10">
            <Skeleton className="h-7 w-40" />

            <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-10" />
                    <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-64 w-full rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-20 rounded-full" />
                    <Skeleton className="h-10 w-16" />
                </div>
            </div>
        </div>
    );
}
