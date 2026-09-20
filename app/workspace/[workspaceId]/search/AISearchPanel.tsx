"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
// Type-only import — erased at compile time, so none of lib/rag/search.ts's
// server code (Mongo/Voyage/Anthropic/Ollama) is ever bundled into the client.
import type { SearchResult } from "@/lib/rag/search";

export function AISearchPanel({ workspaceId }: { workspaceId: string }) {
    const [question, setQuestion] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = question.trim();
        if (!trimmed || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setHasSearched(true);

        try {
            // Workspace scoping comes entirely from the URL segment below —
            // the same workspaceId the page itself was guarded on. The
            // request body only ever carries the question text.
            const res = await fetch(`/api/workspaces/${workspaceId}/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Search failed. Please try again in a moment.");
                return;
            }

            setResult(data as SearchResult);
        } catch {
            setError(
                "Something went wrong while searching. Please try again in a moment."
            );
        } finally {
            setIsLoading(false);
        }
    }

    const hasSources = (result?.citations.length ?? 0) > 0;

    return (
        <div className="animate-fade-in-up mx-auto w-full max-w-2xl px-8 py-10">
            <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-indigo-600 text-white dark:bg-indigo-500">
                    <Sparkles size={15} strokeWidth={2} />
                </span>
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    AI Search
                </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Ask a question and get an answer grounded in this workspace&apos;s
                documents, with sources.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        strokeWidth={2}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    />
                    <input
                        type="text"
                        autoFocus
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask anything about your documents..."
                        aria-label="Ask a question about your workspace documents"
                        disabled={isLoading}
                        className="h-12 w-full rounded-full border border-black/[.12] bg-transparent pl-10 pr-4 text-sm text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-indigo-400"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || question.trim().length === 0}
                    aria-label="Search"
                    className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Search size={16} strokeWidth={2} />
                    )}
                    <span className="hidden sm:inline">
                        {isLoading ? "Searching..." : "Search"}
                    </span>
                </button>
            </form>

            <div className="mt-8">
                {isLoading && <AnswerSkeleton />}

                {!isLoading && error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!isLoading && !error && result && (
                    <div className="animate-fade-in-up flex flex-col gap-6">
                        {/* Answers with no sources (irrelevant question, or an
                            empty/unindexed workspace) get a quieter, neutral
                            card instead of the confident indigo-tinted one —
                            still the exact text the API returned. */}
                        <div
                            className={`rounded-lg border px-4 py-4 ${
                                hasSources
                                    ? "border-indigo-100 bg-indigo-50/60 dark:border-indigo-500/20 dark:bg-indigo-500/[.06]"
                                    : "border-black/[.08] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-900"
                            }`}
                        >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                                {result.answer}
                            </p>
                        </div>

                        {hasSources && (
                            <div>
                                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                                    Sources
                                </h2>
                                <ul className="mt-2.5 flex flex-col gap-2">
                                    {result.citations.map((citation, i) => (
                                        <li
                                            key={citation.documentId}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${i * 40}ms` }}
                                        >
                                            <Link
                                                href={`/workspace/${workspaceId}/documents/${citation.documentId}`}
                                                className="flex items-start gap-3 rounded-lg border border-black/[.08] bg-white px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-md dark:border-white/[.1] dark:bg-zinc-900 dark:hover:border-white/[.2]"
                                            >
                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                                    {i + 1}
                                                </span>
                                                <FileText
                                                    size={15}
                                                    strokeWidth={2}
                                                    className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                                            {citation.documentTitle}
                                                        </span>
                                                        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                                                            {citation.folderName}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                                        {citation.snippet}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && !error && !hasSearched && <EmptyState />}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/[.1] py-14 text-center dark:border-white/[.145]">
            <Sparkles
                size={22}
                strokeWidth={1.5}
                className="text-zinc-400 dark:text-zinc-500"
            />
            <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                Ask a question about anything in this workspace&apos;s documents.
                Answers are grounded in your documents and cite their sources.
            </p>
        </div>
    );
}

function AnswerSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-black/[.08] px-4 py-4 dark:border-white/[.08]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
                <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
            <div>
                <Skeleton className="h-3 w-16" />
                <div className="mt-2.5 flex flex-col gap-2">
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
