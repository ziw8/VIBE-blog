import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSiteSections,
  isSiteSectionKey,
  type SiteSection,
  type SiteSectionKey,
} from "@/lib/site-sections";

export type StoredSiteSectionRow = {
  body: string;
  created_at: string;
  key: string;
  updated_at: string;
};

type StoredSiteSectionInsert = Pick<StoredSiteSectionRow, "body" | "key">;
type StoredSiteSectionUpdate = Partial<
  Pick<StoredSiteSectionRow, "body" | "updated_at">
>;

type SiteSectionsDatabase = {
  public: {
    Tables: {
      site_sections: {
        Row: StoredSiteSectionRow;
        Insert: StoredSiteSectionInsert;
        Update: StoredSiteSectionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const PUBLIC_SITE_SECTION_FIELDS =
  "key, body, created_at, updated_at" as const;

let siteSectionsClient: SupabaseClient<SiteSectionsDatabase> | null = null;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function siteSectionsStorageIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function getSiteSectionsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!siteSectionsClient) {
    siteSectionsClient = createClient<SiteSectionsDatabase>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return siteSectionsClient;
}

export function getPublicSiteSectionFields(): typeof PUBLIC_SITE_SECTION_FIELDS {
  return PUBLIC_SITE_SECTION_FIELDS;
}

export function isMissingSiteSectionsTableError(error: {
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

function toSiteSection(row: StoredSiteSectionRow): SiteSection | null {
  if (!isSiteSectionKey(row.key)) {
    return null;
  }

  return {
    ...defaultSiteSections[row.key],
    body: row.body,
    updatedAt: row.updated_at,
  };
}

export async function getSiteSections({
  throwOnMissing = false,
}: {
  throwOnMissing?: boolean;
} = {}) {
  const supabase = getSiteSectionsClient();

  if (!supabase) {
    return Object.values(defaultSiteSections);
  }

  const { data, error } = await supabase
    .from("site_sections")
    .select(getPublicSiteSectionFields())
    .order("key", { ascending: true });

  if (error) {
    if (isMissingSiteSectionsTableError(error) && !throwOnMissing) {
      return Object.values(defaultSiteSections);
    }

    throw error;
  }

  const storedSections = new Map(
    data
      .map(toSiteSection)
      .filter((section): section is SiteSection => Boolean(section))
      .map((section) => [section.key, section]),
  );

  return Object.values(defaultSiteSections).map(
    (section) => storedSections.get(section.key) ?? section,
  );
}

export async function getSiteSection(key: SiteSectionKey) {
  const supabase = getSiteSectionsClient();

  if (!supabase) {
    return defaultSiteSections[key];
  }

  const { data, error } = await supabase
    .from("site_sections")
    .select(getPublicSiteSectionFields())
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (isMissingSiteSectionsTableError(error)) {
      return defaultSiteSections[key];
    }

    throw error;
  }

  return data ? toSiteSection(data) ?? defaultSiteSections[key] : defaultSiteSections[key];
}
