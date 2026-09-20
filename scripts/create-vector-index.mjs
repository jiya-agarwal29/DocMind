// One-time setup script: creates the Atlas Vector Search index used by RAG
// retrieval. Not something Mongoose/schema code can express — Atlas Search
// indexes are a separate resource from regular MongoDB indexes, created via
// the driver's createSearchIndex or the Atlas UI/Admin API. Re-running this
// is safe: it skips creation if an index with this name already exists.
//
// Usage: npm run rag:create-index
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envText = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const uriLine = envText.split("\n").find((l) => l.startsWith("MONGODB_URI="));
if (!uriLine) {
    throw new Error("MONGODB_URI not found in .env.local");
}
const uri = uriLine.slice("MONGODB_URI=".length).trim();

const INDEX_NAME = "chunk_vector_index";
const COLLECTION_NAME = "documentchunks";

const indexDefinition = {
    name: INDEX_NAME,
    type: "vectorSearch",
    definition: {
        fields: [
            {
                type: "vector",
                path: "embedding",
                numDimensions: 1024,
                similarity: "cosine",
            },
            {
                type: "filter",
                path: "workspaceId",
            },
        ],
    },
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const client = new MongoClient(uri);
    await client.connect();

    try {
        const collection = client.db().collection(COLLECTION_NAME);

        const existing = await collection
            .listSearchIndexes(INDEX_NAME)
            .toArray()
            .catch(() => []);

        if (existing.length > 0) {
            console.log(
                `Index "${INDEX_NAME}" already exists on "${COLLECTION_NAME}" (status: ${existing[0].status}). Nothing to do.`
            );
            return;
        }

        const name = await collection.createSearchIndex(indexDefinition);
        console.log(`Created search index "${name}". Waiting for it to build...`);

        let queryable = false;
        while (!queryable) {
            const cursor = collection.listSearchIndexes(name);
            for await (const idx of cursor) {
                if (idx.name === name && idx.queryable) {
                    queryable = true;
                }
            }
            if (!queryable) {
                await sleep(5000);
            }
        }

        console.log(`Index "${name}" is ready for querying.`);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error("Failed to create vector search index:", err);
    process.exit(1);
});
