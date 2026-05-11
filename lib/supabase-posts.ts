import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StoredPostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  content_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type StoredPostInsert = Omit<
  StoredPostRow,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  deleted_at?: string | null;
};
type StoredPostUpdate = Partial<
  Pick<
    StoredPostRow,
    | "content_html"
    | "deleted_at"
    | "description"
    | "published_at"
    | "slug"
    | "tags"
    | "title"
    | "updated_at"
  >
>;

type PostsDatabase = {
  public: {
    Tables: {
      posts: {
        Row: StoredPostRow;
        Insert: StoredPostInsert;
        Update: StoredPostUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const PUBLIC_POST_FIELDS =
  "id, slug, title, description, tags, content_html, published_at, created_at, updated_at, deleted_at" as const;

let postsClient: SupabaseClient<PostsDatabase> | null = null;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function postsStorageIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function getPostsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!postsClient) {
    postsClient = createClient<PostsDatabase>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return postsClient;
}

export function getPublicPostFields(): typeof PUBLIC_POST_FIELDS {
  return PUBLIC_POST_FIELDS;
}

export function isMissingPostsTableError(error: {
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

export async function getStoredPosts() {
  const supabase = getPostsClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("posts")
    .select(getPublicPostFields())
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (error) {
    if (isMissingPostsTableError(error)) {
      return [];
    }

    throw error;
  }

  return data;
}

export async function getStoredPost(slug: string) {
  const supabase = getPostsClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("posts")
    .select(getPublicPostFields())
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    if (isMissingPostsTableError(error)) {
      return null;
    }

    throw error;
  }

  return data;
}

export async function getStoredPostShadow(slug: string) {
  const supabase = getPostsClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("slug, deleted_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (isMissingPostsTableError(error)) {
      return null;
    }

    throw error;
  }

  return data;
}

export async function getStoredPostShadows() {
  const supabase = getPostsClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("posts")
    .select("slug, deleted_at");

  if (error) {
    if (isMissingPostsTableError(error)) {
      return [];
    }

    throw error;
  }

  return data;
}
