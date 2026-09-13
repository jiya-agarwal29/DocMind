import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";

export default async function CreateWorkspacePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="animate-fade-in-up w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    Create your workspace
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Set up a workspace to start organizing your team&apos;s knowledge.
                </p>

                <CreateWorkspaceForm />
            </div>
        </div>
    );
}
