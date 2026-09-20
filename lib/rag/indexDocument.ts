import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { DocumentChunk } from "@/lib/db/models";
import { chunkMarkdown } from "./chunkText";
import { embedDocuments } from "./voyage";

/**
 * (Re)chunks and (re)embeds a document, replacing any chunks it already has.
 * `workspaceId` is taken from the caller's already-guarded Document record,
 * never re-derived from client input — chunks inherit that same scoping.
 *
 * Callers should treat failures here as best-effort: a Voyage outage
 * shouldn't block saving the document itself, only its searchability.
 */
export async function indexDocument(document: {
    _id: Types.ObjectId | string;
    workspaceId: Types.ObjectId | string;
    content: string;
}): Promise<void> {
    await connectDB();

    const documentId = document._id.toString();
    const workspaceId = document.workspaceId.toString();

    const chunks = chunkMarkdown(document.content);

    if (chunks.length === 0) {
        await DocumentChunk.deleteMany({ documentId });
        return;
    }

    const embeddings = await embedDocuments(chunks.map((c) => c.content));

    await DocumentChunk.deleteMany({ documentId });
    await DocumentChunk.insertMany(
        chunks.map((chunk, i) => ({
            workspaceId,
            documentId,
            chunkIndex: i,
            heading: chunk.heading,
            content: chunk.content,
            embedding: embeddings[i],
        }))
    );
}

/** Removes all chunks for a document. Call when the document itself is deleted. */
export async function deleteDocumentChunks(
    documentId: Types.ObjectId | string
): Promise<void> {
    await connectDB();
    await DocumentChunk.deleteMany({ documentId: documentId.toString() });
}
