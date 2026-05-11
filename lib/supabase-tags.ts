import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StoredTagRow = {
  id: string;
  name: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type StoredTagInsert = Pick<StoredTagRow, "aliases" | "name"> &
  Partial<Pick<StoredTagRow, "deleted_at">>;
type StoredTagUpdate = Partial<
  Pick<StoredTagRow, "aliases" | "deleted_at" | "name" | "updated_at">
>;
type StoredPostTagRow = {
  id: string;
  tags: string[];
};

type TagsDatabase = {
  public: {
    Tables: {
      post_tags: {
        Row: StoredTagRow;
        Insert: StoredTagInsert;
        Update: StoredTagUpdate;
        Relationships: [];
      };
      posts: {
        Row: StoredPostTagRow;
        Insert: never;
        Update: Partial<StoredPostTagRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const PUBLIC_TAG_FIELDS =
  "id, name, aliases, created_at, updated_at, deleted_at" as const;

let tagsClient: SupabaseClient<TagsDatabase> | null = null;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function tagsStorageIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function getTagsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!tagsClient) {
    tagsClient = createClient<TagsDatabase>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return tagsClient;
}

export function getPublicTagFields(): typeof PUBLIC_TAG_FIELDS {
  return PUBLIC_TAG_FIELDS;
}

export function isMissingTagsTableError(error: {
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

export async function getStoredTags({
  includeDeleted = false,
  throwOnMissing = false,
}: {
  includeDeleted?: boolean;
  throwOnMissing?: boolean;
} = {}) {
  const supabase = getTagsClient();

  if (!supabase) {
    return [];
  }

  let query = supabase.from("post_tags").select(getPublicTagFields());

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    if (isMissingTagsTableError(error) && !throwOnMissing) {
      return [];
    }

    throw error;
  }

  return data;
}

export async function getStoredTag(id: string) {
  const supabase = getTagsClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("post_tags")
    .select(getPublicTagFields())
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTagsTableError(error)) {
      return null;
    }

    throw error;
  }

  return data;
}

export function normalizeTagName(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function validateTagName(
  value: unknown,
): { ok: true; value: string } | { ok: false; message: string } {
  const name = typeof value === "string" ? normalizeTagName(value) : "";

  if (!name || name.length > 32) {
    return { ok: false, message: "태그는 32자 이하로 입력해주세요." };
  }

  if (/[<>]/.test(name)) {
    return { ok: false, message: "태그 이름을 다시 확인해주세요." };
  }

  return { ok: true, value: name };
}
