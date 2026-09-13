import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFolder extends Document {
    workspaceId: Types.ObjectId;
    name: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// One folder name per workspace.
FolderSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const Folder =
    mongoose.models.Folder || mongoose.model<IFolder>("Folder", FolderSchema);
