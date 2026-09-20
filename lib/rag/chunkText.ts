export interface Chunk {
    heading: string | null;
    content: string;
}

// Rough proxy for "~800 tokens" without pulling in a tokenizer dependency
// (~4 chars/token is a standard approximation for English prose).
const TARGET_CHARS = 3200;
const MAX_CHUNKS_PER_DOCUMENT = 200;

const HEADING_LINE = /^#{1,6}\s+(.*)$/;

interface Section {
    heading: string | null;
    body: string;
}

function splitIntoSections(content: string): Section[] {
    const lines = content.split("\n");
    const sections: Section[] = [];
    let currentHeading: string | null = null;
    let currentLines: string[] = [];

    const flush = () => {
        const body = currentLines.join("\n").trim();
        if (body) sections.push({ heading: currentHeading, body });
        currentLines = [];
    };

    for (const line of lines) {
        const match = line.match(HEADING_LINE);
        if (match) {
            flush();
            currentHeading = match[1].trim();
        } else {
            currentLines.push(line);
        }
    }
    flush();

    return sections;
}

// Splits oversized text on whichever boundary is available, coarsest first,
// so a chunk never cuts mid-paragraph or mid-sentence unless it truly has to.
function splitOversized(text: string, boundary: RegExp): string[] {
    const pieces = text.split(boundary).filter((p) => p.trim());
    return pieces.length > 1 ? pieces : [text];
}

function packPieces(pieces: string[]): string[] {
    const packed: string[] = [];
    let current = "";

    for (const piece of pieces) {
        if (piece.length > TARGET_CHARS) {
            if (current) {
                packed.push(current);
                current = "";
            }
            // Still too big on its own — fall back to sentence, then hard,
            // splitting.
            const sentences = splitOversized(piece, /(?<=[.!?])\s+/);
            for (const sentence of sentences) {
                if (sentence.length > TARGET_CHARS) {
                    for (let i = 0; i < sentence.length; i += TARGET_CHARS) {
                        packed.push(sentence.slice(i, i + TARGET_CHARS));
                    }
                } else if (current.length + sentence.length + 1 > TARGET_CHARS) {
                    if (current) packed.push(current);
                    current = sentence;
                } else {
                    current = current ? `${current} ${sentence}` : sentence;
                }
            }
            continue;
        }

        if (current.length + piece.length + 2 > TARGET_CHARS) {
            if (current) packed.push(current);
            current = piece;
        } else {
            current = current ? `${current}\n\n${piece}` : piece;
        }
    }

    if (current) packed.push(current);
    return packed;
}

/**
 * Splits a document's markdown content into chunks suitable for embedding.
 * Recursively prefers the coarsest boundary that keeps a chunk under
 * TARGET_CHARS: heading sections first, then paragraphs, then sentences,
 * then a hard character cutoff as a last resort.
 */
export function chunkMarkdown(content: string): Chunk[] {
    const sections = splitIntoSections(content);
    const chunks: Chunk[] = [];

    for (const section of sections) {
        const paragraphs = splitOversized(section.body, /\n{2,}/);
        const packed = packPieces(paragraphs);
        for (const text of packed) {
            chunks.push({ heading: section.heading, content: text.trim() });
        }
    }

    return chunks.slice(0, MAX_CHUNKS_PER_DOCUMENT);
}
