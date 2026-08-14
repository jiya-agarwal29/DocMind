# DocMind — Project Context

## What this is
An AI-powered internal knowledge base for companies. Employees store 
policy docs, SOPs, onboarding guides, and company info in one place. 
An AI search feature answers employee questions using RAG (retrieval-
augmented generation), grounded only in the company's own documents — 
it never makes up answers. If information isn't in any document, it 
says so instead of guessing.

## Tech stack
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Next.js API routes
- Database: MongoDB Atlas (+ Atlas Vector Search for RAG)
- AI: Claude API for embeddings + answer generation
- Auth: Role-based access control (admin / editor / viewer), scoped per workspace
- Deployment (later phase): Docker + AWS + GitHub Actions CI/CD

## Roles
- Admin: create/manage workspace, invite/remove members, assign roles, 
  create folders, write/edit docs, use AI search
- Editor: write/edit docs in existing folders, use AI search — cannot 
  manage team or workspace settings
- Viewer: read-only access to docs, use AI search — cannot create/edit

## Data model
- workspaces: { _id, name, plan }
- users: { _id, email, passwordHash, name }
- memberships: { userId, workspaceId, role }
- documents: { _id, workspaceId, folderId, title, content, updatedAt }
- folders: { _id, workspaceId, name }

## Multi-tenancy rule
Every document, folder, and query MUST be scoped by workspaceId. 
No query should ever return data across workspaces.

## Build order
1. Auth + workspace creation + invite flow
2. Folders + document CRUD + markdown editor
3. RAG pipeline: chunk docs → embed → store in MongoDB Atlas Vector 
   Search → retrieve on query → generate answer with citation
4. Dockerize the app
5. Deploy to AWS
6. CI/CD via GitHub Actions

## Screens
Login/Signup, Create workspace, Main dashboard, Folder/documents list, 
Document editor, Document viewer (read-only), AI search/chat, Team 
management (admin only), Settings