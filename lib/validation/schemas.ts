import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  workspaceId: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
});

// Body for POST /api/workspaces/[workspaceId]/invites — workspaceId comes from
// the URL path, never the request body.
export const CreateInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "editor", "viewer"]),
});

// Body for POST /api/invites/accept.
export const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

// Body for POST /api/workspaces/[workspaceId]/folders.
export const CreateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").trim(),
});

// Body for PATCH /api/workspaces/[workspaceId]/folders/[folderId].
export const RenameFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").trim(),
});

// Body for POST /api/workspaces/[workspaceId]/folders/[folderId]/documents.
export const CreateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().default(""),
});

// Body for PATCH /api/workspaces/[workspaceId]/documents/[documentId].
// folderId lets a document be moved between folders within the same workspace.
export const UpdateDocumentSchema = z
  .object({
    title: z.string().min(1, "Title is required").trim().optional(),
    content: z.string().optional(),
    folderId: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type RenameFolderInput = z.infer<typeof RenameFolderSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
