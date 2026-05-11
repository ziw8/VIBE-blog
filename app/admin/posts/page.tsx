import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPostsTabs } from "@/components/admin-posts-tabs";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { getPublishedPosts } from "@/lib/posts";
import { getStoredDrafts } from "@/lib/supabase-drafts";

export const metadata: Metadata = {
  title: "Admin Posts",
  description: "게시글 관리 페이지입니다.",
};

export default async function AdminPostsPage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const [posts, drafts] = await Promise.all([
    getPublishedPosts(),
    getStoredDrafts(),
  ]);

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
                글 관리
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/admin"
                className="text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
              >
                {"<- Admin"}
              </Link>
              <Link
                href="/admin/posts/new"
                className="text-sm font-semibold text-black underline decoration-black/25 underline-offset-4 transition-colors duration-300 ease-in-out hover:decoration-black/60 dark:text-white dark:decoration-white/35 dark:hover:decoration-white/70"
              >
                새 글 쓰기
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminPostsTabs
            drafts={drafts.map((draft) => ({
              id: draft.id,
              title: draft.title,
              updatedAt: draft.updated_at,
            }))}
            posts={posts.map((post) => ({
              date: post.date,
              slug: post.slug,
              title: post.title,
            }))}
          />
        </Reveal>
      </div>
    </Container>
  );
}
