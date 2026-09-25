import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RetrievedChunk } from "./retrieve";

const ANTHROPIC_MODEL = "claude-opus-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

const OLLAMA_NUM_CTX = 16384;

const SYSTEM_PROMPT = `You are DocMind's AI search assistant. Answer the user's question using ONLY the numbered source excerpts provided — they are the only documents you have access to, and nothing else.

Rules:
- Cite the excerpt number in brackets right after each claim it supports, e.g. [1].
- If the excerpts don't actually answer the question, say plainly that the workspace's documents don't cover it — never fill the gap with outside knowledge.
- Be concise and direct.`;

export async function generateAnswer(
    question: string,
    chunks: RetrievedChunk[],
    citationNumbers: Map<string, number>,
): Promise<string> {
    const sources = chunks
        .map(
            (c) =>
                `[${citationNumbers.get(c.documentId)}] (from "${c.documentTitle}")\n${c.content}`,
        )
        .join("\n\n");
    const userMessage = `Sources:\n\n${sources}\n\nQuestion: ${question}`;

    const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

    if (provider === "ollama") {
        return callOllama(userMessage);
    }

    if (provider === "gemini") {
        return callGemini(userMessage);
    }

    if (provider !== "anthropic") {
        console.warn(
            `Unrecognized LLM_PROVIDER "${provider}" — falling back to anthropic.`,
        );
    }
    return callAnthropic(userMessage);
}

async function callAnthropic(userMessage: string): Promise<string> {
    const client = new Anthropic();

    const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        thinking: { type: "disabled" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return textBlock?.text ?? "";
}

export class GenerationTimeoutError extends Error {
    constructor() {
        super("Still generating your answer — please try again.");
        this.name = "GenerationTimeoutError";
    }
}

// One shared budget for the whole Gemini call, retries included, so the user
// never waits longer than this no matter how many attempts happen inside it.
const GEMINI_DEADLINE_MS = 20_000;
// Delays before retry 1 and retry 2 (max 2 retries), each with ±25% jitter.
const GEMINI_RETRY_DELAYS_MS = [1000, 3000];
// Don't bother retrying if less than this would remain after the wait.
const GEMINI_MIN_ATTEMPT_MS = 2000;

const jitter = (ms: number) => Math.round(ms * (0.75 + Math.random() * 0.5));

// Resolves after `ms`, or rejects early if the shared deadline aborts.
const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new GenerationTimeoutError());
        const onAbort = () => {
            clearTimeout(timer);
            reject(new GenerationTimeoutError());
        };
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        signal.addEventListener("abort", onAbort, { once: true });
    });

function isRetryableGeminiError(error: unknown): boolean {
    if (typeof error !== "object" || error === null || !("status" in error)) {
        return false;
    }
    const status = Number(error.status);
    return status === 503 || status === 429;
}

async function callGemini(userMessage: string): Promise<string> {
    // Constructed lazily, same reasoning as callAnthropic — importing this
    // file shouldn't throw just because GEMINI_API_KEY is unset when a
    // different provider is active.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
    });

    const controller = new AbortController();
    const deadline = Date.now() + GEMINI_DEADLINE_MS;
    const timer = setTimeout(() => controller.abort(), GEMINI_DEADLINE_MS);

    try {
        for (let attempt = 0; ; attempt++) {
            try {
                const result = await model.generateContent(userMessage, {
                    signal: controller.signal,
                });
                return result.response.text();
            } catch (error) {
                if (controller.signal.aborted) throw new GenerationTimeoutError();

                const delay = GEMINI_RETRY_DELAYS_MS[attempt];
                if (delay === undefined || !isRetryableGeminiError(error)) {
                    throw error;
                }

                const wait = jitter(delay);
                if (deadline - Date.now() < wait + GEMINI_MIN_ATTEMPT_MS) {
                    throw new GenerationTimeoutError();
                }

                console.warn(
                    `Gemini temporarily unavailable (${(error as { status?: unknown }).status}). ` +
                        `Retry ${attempt + 1}/${GEMINI_RETRY_DELAYS_MS.length} in ${wait}ms...`,
                );
                await sleep(wait, controller.signal);
            }
        }
    } finally {
        clearTimeout(timer);
    }
}

interface OllamaChatResponse {
    message?: { content?: string };
}

async function callOllama(userMessage: string): Promise<string> {
    let res: Response;
    try {
        res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                stream: false,
                options: { num_ctx: OLLAMA_NUM_CTX },
            }),
        });
    } catch (err) {
        throw new Error(
            `Could not reach Ollama at ${OLLAMA_BASE_URL}. Is the Ollama app/service running? ` +
            `(${err instanceof Error ? err.message : String(err)})`,
        );
    }

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 404) {
            throw new Error(
                `Ollama model "${OLLAMA_MODEL}" is not available. Run \`ollama pull ${OLLAMA_MODEL}\` and try again. (${body})`,
            );
        }
        throw new Error(`Ollama request failed (${res.status}): ${body}`);
    }

    const json: OllamaChatResponse = await res.json();
    return json.message?.content ?? "";
}
