import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { DocumentChunk, Document, Folder } from "@/lib/db/models";
import { embedQuery } from "./voyage";

export interface RetrievedChunk {
    documentId: string;
    documentTitle: string;
    folderId: string;
    folderName: string;
    heading: string | null;
    content: string;
    score: number;
}

const NUM_CANDIDATES = 150;
const LIMIT = 8;

interface RawVectorSearchHit {
    workspaceId: Types.ObjectId;
    documentId: Types.ObjectId;
    heading: string | null;
    content: string;
    score: number;
}

/**
 * Finds the chunks most relevant to `question`, scoped to a single
 * workspace. `workspaceId` must already be guard-verified by the caller
 * (never take it from a request body) — it is both the Atlas index filter
 * AND re-checked on every returned chunk below, so a bug that dropped the
 * filter clause would throw here instead of silently leaking another
 * workspace's content into a prompt.
 */
export async function retrieveChunks(
    workspaceId: string,
    question: string
): Promise<RetrievedChunk[]> {
    await connectDB();

    const queryVector = await embedQuery(question);
    const workspaceObjectId = new Types.ObjectId(workspaceId);

    const hits: RawVectorSearchHit[] = await DocumentChunk.aggregate([
        {
            $vectorSearch: {
                index: "chunk_vector_index",
                path: "embedding",
                queryVector,
                numCandidates: NUM_CANDIDATES,
                limit: LIMIT,
                filter: { workspaceId: workspaceObjectId },
            },
        },
        { $addFields: { score: { $meta: "vectorSearchScore" } } },
        { $project: { embedding: 0 } },
    ]);

    const safeHits = hits.filter(
        (hit) => hit.workspaceId.toString() === workspaceId
    );
    if (safeHits.length === 0) return [];

    const documentIds = [
        ...new Set(safeHits.map((hit) => hit.documentId.toString())),
    ];
    const documents = await Document.find({
        _id: { $in: documentIds },
        workspaceId,
    })
        .select("title folderId")
        .lean();
    const documentMap = new Map(documents.map((doc) => [doc._id.toString(), doc]));

    const folderIds = [
        ...new Set(documents.map((doc) => doc.folderId.toString())),
    ];
    const folders = await Folder.find({ _id: { $in: folderIds }, workspaceId })
        .select("name")
        .lean();
    const folderMap = new Map(folders.map((f) => [f._id.toString(), f]));

    const results: RetrievedChunk[] = [];
    for (const hit of safeHits) {
        // Parent document may have been deleted between indexing and search
        // (or chunk cleanup lagged a delete) — skip defensively rather than
        // surface a citation to nothing.
        const doc = documentMap.get(hit.documentId.toString());
        if (!doc) continue;

        const folder = folderMap.get(doc.folderId.toString());
        results.push({
            documentId: doc._id.toString(),
            documentTitle: doc.title,
            folderId: doc.folderId.toString(),
            folderName: folder?.name ?? "Unknown folder",
            heading: hit.heading,
            content: hit.content,
            score: hit.score,
        });
    }

    return results;
}
