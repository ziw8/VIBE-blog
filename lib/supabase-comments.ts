import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CommentEmoji, PublicComment } from "@/lib/comment-config";

export type CommentRow = {
  id: string;
  post_slug: string;
  parent_id: string | null;
  nickname: string;
  body: string;
  emoji: CommentEmoji | null;
  password_hash: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type CommentInsert = Omit<
  CommentRow,
  "id" | "created_at" | "updated_at" | "deleted_at" | "parent_id"
> & {
  parent_id?: string | null;
};
type CommentUpdate = Partial<
  Pick<CommentRow, "body" | "emoji" | "deleted_at" | "updated_at">
>;

type CommentsDatabase = {
  public: {
    Tables: {
      comments: {
        Row: CommentRow;
        Insert: CommentInsert;
        Update: CommentUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const PUBLIC_COMMENT_FIELDS =
  "id, post_slug, parent_id, nickname, body, emoji, created_at, updated_at" as const;
const LEGACY_PUBLIC_COMMENT_FIELDS =
  "id, post_slug, nickname, body, emoji, created_at, updated_at" as const;

let commentsClient: SupabaseClient<CommentsDatabase> | null = null;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function commentsAreConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function getCommentsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!commentsClient) {
    commentsClient = createClient<CommentsDatabase>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return commentsClient;
}

export function getPublicCommentFields(): typeof PUBLIC_COMMENT_FIELDS {
  return PUBLIC_COMMENT_FIELDS;
}

export function getLegacyPublicCommentFields(): typeof LEGACY_PUBLIC_COMMENT_FIELDS {
  return LEGACY_PUBLIC_COMMENT_FIELDS;
}

export function isMissingParentIdError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("parent_id")
  );
}

export function hashCommentPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyCommentPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}

export function toPublicComment(
  row: Pick<
    CommentRow,
    | "id"
    | "post_slug"
    | "nickname"
    | "body"
    | "emoji"
    | "created_at"
    | "updated_at"
  > &
    Partial<Pick<CommentRow, "parent_id">>,
): PublicComment {
  const createdAt = new Date(row.created_at).getTime();
  const updatedAt = new Date(row.updated_at).getTime();

  return {
    id: row.id,
    postSlug: row.post_slug,
    parentId: row.parent_id ?? null,
    nickname: row.nickname,
    body: row.body,
    emoji: row.emoji,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isEdited: Number.isFinite(createdAt)
      ? updatedAt - createdAt > 1000
      : row.updated_at !== row.created_at,
  };
}
