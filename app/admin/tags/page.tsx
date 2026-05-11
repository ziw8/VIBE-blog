import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminTagManager } from "@/components/admin-tag-manager";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  getStoredTags,
  isMissingTagsTableError,
  type StoredTagRow,
} from "@/lib/supabase-tags";

export const metadata: Metadata = {
  title: "Admin Tags",
  description: "태그 관리 페이지입니다.",
};

export default async function AdminTagsPage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  let tags: StoredTagRow[];
  let setupRequired = false;

  try {
    tags = await getStoredTags({ throwOnMissing: true });
  } catch (error) {
    if (isMissingTagsTableError(error as { code?: string; message?: string })) {
      setupRequired = true;
      tags = [];
    } else {
      throw error;
    }
  }

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-black/50 dark:text-white/50">
                관리자
              </p>
              <h1 className="text-2xl font-semibold text-black dark:text-white">
                태그 관리
              </h1>
            </div>
            <Link
              href="/admin"
              className="shrink-0 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
            >
              {"<- Admin"}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {setupRequired ? (
            <p className="border-t border-black/10 pt-4 text-black/60 dark:border-white/15 dark:text-white/60">
              Supabase 태그 설정이 필요합니다. supabase/tags.sql을
              실행해주세요.
            </p>
          ) : (
            <AdminTagManager
              tags={tags.map((tag) => ({
                id: tag.id,
                name: tag.name,
              }))}
            />
          )}
        </Reveal>
      </div>
    </Container>
  );
}
