import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedChunk } from "./retrieve";

const ANTHROPIC_MODEL = "claude-opus-5";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

// retrieve.ts returns up to 8 chunks, each up to ~3200 chars (chunkText.ts's
// TARGET_CHARS, ~800 tokens at ~4 chars/token) => ~6400 tokens of source
// content alone, plus the system prompt, question, and citation headers.
// Ollama's default num_ctx (2048-4096 depending on model) would silently
// truncate that, dropping chunks out of context without any error — so this
// is set well above the worst case rather than left to the model's default.
const OLLAMA_NUM_CTX = 16384;

const SYSTEM_PROMPT = `You are DocMind's AI search assistant. Answer the user's question using ONLY the numbered source excerpts provided — they are the only documents you have access to, and nothing else.

Rules:
- Cite the excerpt number in brackets right after each claim it supports, e.g. [1].
- If the excerpts don't actually answer the question, say plainly that the workspace's documents don't cover it — never fill the gap with outside knowledge.
- Be concise and direct.`;

export async function generateAnswer(
    question: string,
    chunks: RetrievedChunk[],
    citationNumbers: Map<string, number>
): Promise<string> {
    // citationNumbers is keyed by documentId and built by search.ts from the
    // exact same deduplicated list it returns to the frontend as `citations`
    // — so a number the model writes here always points at the same source
    // the UI displays. Every chunk's documentId is guaranteed to be a key
    // (the map is derived from these same chunks), so multiple chunks from
    // one document correctly share one citation number instead of each
    // getting its own.
    const sources = chunks
        .map((c) => `[${citationNumbers.get(c.documentId)}] (from "${c.documentTitle}")\n${c.content}`)
        .join("\n\n");
    const userMessage = `Sources:\n\n${sources}\n\nQuestion: ${question}`;

    const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

    if (provider === "ollama") {
        return callOllama(userMessage);
    }

    if (provider !== "anthropic") {
        console.warn(
            `Unrecognized LLM_PROVIDER "${provider}" — falling back to anthropic.`
        );
    }
    return callAnthropic(userMessage);
}

async function callAnthropic(userMessage: string): Promise<string> {
    // Constructed lazily (per call, not at module load) so importing this
    // file never throws just because ANTHROPIC_API_KEY is unset — e.g. a
    // dev running entirely on LLM_PROVIDER=ollama with no Anthropic key
    // configured at all.
    const client = new Anthropic();

    const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        thinking: { type: "disabled" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
    );
    return textBlock?.text ?? "";
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
                `(${err instanceof Error ? err.message : String(err)})`
        );
    }

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 404) {
            throw new Error(
                `Ollama model "${OLLAMA_MODEL}" is not available. Run \`ollama pull ${OLLAMA_MODEL}\` and try again. (${body})`
            );
        }
        throw new Error(`Ollama request failed (${res.status}): ${body}`);
    }

    const json: OllamaChatResponse = await res.json();
    return json.message?.content ?? "";
}
