export function NotAuthorized({ message }: { message: string }) {
    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    You don&apos;t have access
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {message}
                </p>
            </div>
        </div>
    );
}
