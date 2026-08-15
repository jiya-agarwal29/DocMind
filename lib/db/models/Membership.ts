import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMembership extends Document {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
      default: "viewer",
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const Membership =
  mongoose.models.Membership ||
  mongoose.model<IMembership>("Membership", MembershipSchema);
