import mongoose, { Schema, Types } from "mongoose";

export interface IDocumentChunk extends mongoose.Document {
    workspaceId: Types.ObjectId;
    documentId: Types.ObjectId;
    chunkIndex: number;
    heading: string | null;
    content: string;
    embedding: number[];
    createdAt: Date;
    updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        documentId: {
            type: Schema.Types.ObjectId,
            ref: "Document",
            required: true,
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
        heading: {
            type: String,
            default: null,
        },
        content: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            required: true,
        },
    },
    { timestamps: true }
);

// Used to delete/replace all chunks for a document on re-index, and to
// scope cleanup to a single workspace.
DocumentChunkSchema.index({ workspaceId: 1, documentId: 1 });

export const DocumentChunk =
    mongoose.models.DocumentChunk ||
    mongoose.model<IDocumentChunk>("DocumentChunk", DocumentChunkSchema);
