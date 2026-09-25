import { retrieveChunks, type RetrievedChunk } from "./retrieve";
import { generateAnswer } from "./generateAnswer";

export interface Citation {
    documentId: string;
    documentTitle: string;
    folderId: string;
    folderName: string;
    snippet: string;
}

export interface SearchResult {
    answer: string;
    citations: Citation[];
}

const NO_DOCUMENTS_ANSWER =
    "This workspace doesn't have any indexed documents yet, so there's nothing to search.";

/**
 * Full RAG search for one workspace: retrieve relevant chunks, then generate
 * a grounded, cited answer from them. `workspaceId` must already be
 * guard-verified by the caller — see retrieveChunks for the isolation
 * mechanism.
 *
 * Citation numbering: the deduplicated `citations` list is built ONCE, up
 * front, from the retrieved chunks. That same list (by array position) is
 * what both the LLM prompt and the returned `citations` are numbered from —
 * so a `[n]` the model writes always identifies the same document as
 * `citations[n - 1]`. Retrieval can return several chunks from one
 * document; those chunks share a single citation number instead of each
 * claiming its own.
 */
export async function searchWorkspace(
    workspaceId: string,
    question: string
): Promise<SearchResult> {
    const chunks = await retrieveChunks(workspaceId, question);

    if (chunks.length === 0) {
        return { answer: NO_DOCUMENTS_ANSWER, citations: [] };
    }

    const citations = buildCitations(chunks);

    const citationNumbers = new Map(
        citations.map((citation, i) => [citation.documentId, i + 1])
    );

    const rawAnswer = await generateAnswer(
        question,
        chunks,
        citationNumbers
    );

    const answer = sanitizeCitationMarkers(rawAnswer, citations.length);

    return { answer, citations };
}

function buildCitations(chunks: RetrievedChunk[]): Citation[] {
    const seen = new Map<string, Citation>();
    for (const chunk of chunks) {
        if (!seen.has(chunk.documentId)) {
            seen.set(chunk.documentId, {
                documentId: chunk.documentId,
                documentTitle: chunk.documentTitle,
                folderId: chunk.folderId,
                folderName: chunk.folderName,
                snippet: chunk.content.slice(0, 180),
            });
        }
    }
    return [...seen.values()];
}

const CITATION_MARKER = /\[(\d+)\]/g;

// A model (small local ones especially) can occasionally write a bracket
// number outside the sources it was actually given. Strip those rather than
// let the UI show a citation that doesn't correspond to any real source.
function sanitizeCitationMarkers(answer: string, citationCount: number): string {
    return answer
        .replace(CITATION_MARKER, (match, numStr: string) => {
            const n = Number(numStr);
            return n >= 1 && n <= citationCount ? match : "";
        })
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1");
}
