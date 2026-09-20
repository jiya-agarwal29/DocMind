const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-4";

type VoyageInputType = "document" | "query";

interface VoyageEmbeddingsResponse {
    data: { embedding: number[]; index: number }[];
}

async function embedTexts(
    texts: string[],
    inputType: VoyageInputType
): Promise<number[][]> {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
        throw new Error("VOYAGE_API_KEY environment variable is not defined");
    }

    const res = await fetch(VOYAGE_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: texts,
            model: VOYAGE_MODEL,
            input_type: inputType,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            `Voyage embeddings request failed (${res.status}): ${body}`
        );
    }

    const json = (await res.json()) as VoyageEmbeddingsResponse;

    // Voyage returns embeddings tagged with their input index — sort so the
    // result lines up positionally with the input `texts` array.
    return json.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
}

/** Embed chunk text for storage. Use at index/write time. */
export function embedDocuments(texts: string[]): Promise<number[][]> {
    return embedTexts(texts, "document");
}

/** Embed a user's search question. Use at retrieval time. */
export async function embedQuery(text: string): Promise<number[]> {
    const [embedding] = await embedTexts([text], "query");
    return embedding;
}
