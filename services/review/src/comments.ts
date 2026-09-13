export interface TenantContext {
  tenantId: string;
}

export function asTenant(tenantId: string): TenantContext {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('Tenant ID must be a non-empty string');
  }
  return { tenantId };
}

export interface CommentAnchor {
  from: number;
  to: number;
  textSnippet?: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface CommentMessage {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  tenantId: string;
  documentId: string;
  anchor: CommentAnchor;
  messages: CommentMessage[];
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  anchor: CommentAnchor;
  message: string;
  author?: Partial<CommentAuthor>;
}

// In-memory tenant-isolated datastore (implements the PostgreSQL schema semantics)
const threadStore = new Map<string, CommentThread>();

export function clearAllStoresForTest(): void {
  threadStore.clear();
}

export async function createComment(
  ctx: TenantContext,
  documentId: string,
  request: CreateCommentRequest
): Promise<CommentThread> {
  const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const author: CommentAuthor = {
    id: request.author?.id || 'anonymous',
    name: request.author?.name || 'Anonymous User',
    avatarUrl: request.author?.avatarUrl
  };

  const thread: CommentThread = {
    id,
    tenantId: ctx.tenantId,
    documentId,
    anchor: request.anchor,
    messages: [
      {
        id: `msg_${Date.now()}`,
        author,
        content: request.message,
        createdAt: now
      }
    ],
    resolved: false,
    createdAt: now,
    updatedAt: now
  };

  threadStore.set(id, thread);
  return thread;
}

export async function listComments(
  ctx: TenantContext,
  documentId: string
): Promise<CommentThread[]> {
  const results: CommentThread[] = [];
  for (const thread of threadStore.values()) {
    if (thread.tenantId === ctx.tenantId && thread.documentId === documentId) {
      results.push(thread);
    }
  }
  return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function resolveCommentThread(
  ctx: TenantContext,
  threadId: string
): Promise<CommentThread> {
  const thread = threadStore.get(threadId);
  if (!thread || thread.tenantId !== ctx.tenantId) {
    throw new Error(`Comment thread "${threadId}" not found for tenant`);
  }

  thread.resolved = true;
  thread.updatedAt = new Date().toISOString();
  threadStore.set(threadId, thread);
  return thread;
}

export async function addReply(
  ctx: TenantContext,
  threadId: string,
  message: string,
  author?: Partial<CommentAuthor>
): Promise<CommentThread> {
  const thread = threadStore.get(threadId);
  if (!thread || thread.tenantId !== ctx.tenantId) {
    throw new Error(`Comment thread "${threadId}" not found for tenant`);
  }

  const replyAuthor: CommentAuthor = {
    id: author?.id || 'anonymous',
    name: author?.name || 'Anonymous User',
    avatarUrl: author?.avatarUrl
  };

  thread.messages.push({
    id: `msg_${Date.now()}`,
    author: replyAuthor,
    content: message,
    createdAt: new Date().toISOString()
  });

  thread.updatedAt = new Date().toISOString();
  threadStore.set(threadId, thread);
  return thread;
}
