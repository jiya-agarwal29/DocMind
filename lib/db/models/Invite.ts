import mongoose, { Schema, Document, Types } from "mongoose";

export type InviteRole = "admin" | "editor" | "viewer";
export type InviteStatus = "pending" | "accepted" | "expired";

export interface IInvite extends Document {
    email: string;
    workspaceId: Types.ObjectId;
    role: InviteRole;
    invitedBy: Types.ObjectId;
    token: string;
    status: InviteStatus;
    expiresAt: Date;
    acceptedBy?: Types.ObjectId;
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ["admin", "editor", "viewer"],
            required: true,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "expired"],
            default: "pending",
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        acceptedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        acceptedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Fast lookups for the team page's "pending invites" list.
InviteSchema.index({ workspaceId: 1, status: 1 });

export const Invite =
    mongoose.models.Invite || mongoose.model<IInvite>("Invite", InviteSchema);
