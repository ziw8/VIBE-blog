import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StoredDraftRow = {
  id: string;
  title: string;
  tags: string[];
  content_html: string;
  created_at: string;
  updated_at: string;
};

type StoredDraftInsert = Pick<
  StoredDraftRow,
  "content_html" | "tags" | "title"
>;
type StoredDraftUpdate = Partial<
  Pick<StoredDraftRow, "content_html" | "tags" | "title" | "updated_at">
>;

type DraftsDatabase = {
  public: {
    Tables: {
      post_drafts: {
        Row: StoredDraftRow;
        Insert: StoredDraftInsert;
        Update: StoredDraftUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const PUBLIC_DRAFT_FIELDS =
  "id, title, tags, content_html, created_at, updated_at" as const;

let draftsClient: SupabaseClient<DraftsDatabase> | null = null;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function draftsStorageIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function getDraftsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!draftsClient) {
    draftsClient = createClient<DraftsDatabase>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return draftsClient;
}

export function getPublicDraftFields(): typeof PUBLIC_DRAFT_FIELDS {
  return PUBLIC_DRAFT_FIELDS;
}

export function isMissingDraftsTableError(error: {
  code?: string;
  message?: string;
}) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

export async function getStoredDrafts() {
  const supabase = getDraftsClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .select(getPublicDraftFields())
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingDraftsTableError(error)) {
      return [];
    }

    throw error;
  }

  return data;
}

export async function getStoredDraft(id: string) {
  const supabase = getDraftsClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .select(getPublicDraftFields())
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingDraftsTableError(error)) {
      return null;
    }

    throw error;
  }

  return data;
}
