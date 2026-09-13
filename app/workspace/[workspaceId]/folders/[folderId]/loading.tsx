import { Skeleton } from "@/components/Skeleton";

export default function FolderDetailLoading() {
    return (
        <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="mt-2 h-7 w-44" />
                </div>
                <Skeleton className="h-10 w-36 rounded-full" />
            </div>

            <Skeleton className="mt-10 h-3 w-28" />
            <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        </div>
    );
}
