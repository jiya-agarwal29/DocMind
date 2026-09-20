// One-time backfill: indexes every existing Document through the SAME
// indexDocument() pipeline the app already uses on create/update, for
// documents that existed before that wiring was added and therefore have
// no DocumentChunk records.
//
// Reuses the real pipeline as-is — no separate chunking/embedding logic
// here. indexDocument() already does `DocumentChunk.deleteMany({ documentId
// })` before inserting, so re-running this (or re-running it on a document
// that's already indexed) never creates duplicate chunks — safe to run more
// than once.
//
// Usage: npm run rag:backfill
import { connectDB, disconnectDB } from "@/lib/db/connect";
import { Document, DocumentChunk } from "@/lib/db/models";
import { indexDocument } from "@/lib/rag/indexDocument";

async function main() {
    await connectDB();

    const documents = await Document.find({}).lean();
    console.log(`Found ${documents.length} document(s) to process.\n`);

    let successCount = 0;
    let failedCount = 0;
    const failures = [];

    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const label = `[${i + 1}/${documents.length}] "${doc.title}" (${doc._id.toString()})`;

        const existingChunks = await DocumentChunk.countDocuments({
            documentId: doc._id,
        });
        console.log(
            `${label} — existing chunks: ${existingChunks} (will be replaced)`
        );

        try {
            await indexDocument({
                _id: doc._id,
                workspaceId: doc.workspaceId,
                content: doc.content,
            });
            const newChunkCount = await DocumentChunk.countDocuments({
                documentId: doc._id,
            });
            console.log(`  -> indexed successfully (${newChunkCount} chunk(s))`);
            successCount++;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`  -> FAILED: ${message}`);
            failedCount++;
            failures.push({ id: doc._id.toString(), title: doc.title, message });
        }
    }

    console.log("\n=== Backfill summary ===");
    console.log(`Total documents: ${documents.length}`);
    console.log(`Successful:      ${successCount}`);
    console.log(`Failed:          ${failedCount}`);
    if (failures.length > 0) {
        console.log("\nFailed documents:");
        for (const f of failures) {
            console.log(`  - "${f.title}" (${f.id}): ${f.message}`);
        }
    }

    await disconnectDB();
    process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error("Backfill script crashed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
