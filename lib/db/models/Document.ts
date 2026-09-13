import mongoose, { Schema, Types } from "mongoose";

export interface IDocument extends mongoose.Document {
    workspaceId: Types.ObjectId;
    folderId: Types.ObjectId;
    title: string;
    content: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        folderId: {
            type: Schema.Types.ObjectId,
            ref: "Folder",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Primary access pattern: list documents in a folder within a workspace.
// Also covers workspace-only lookups since workspaceId is a prefix.
DocumentSchema.index({ workspaceId: 1, folderId: 1 });

export const Document =
    mongoose.models.Document ||
    mongoose.model<IDocument>("Document", DocumentSchema);
