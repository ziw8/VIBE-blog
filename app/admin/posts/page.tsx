import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { getPublishedPosts } from "@/lib/posts";
import { formatCompactDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Posts",
  description: "게시글 관리 페이지입니다.",
};

export default async function AdminPostsPage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const posts = await getPublishedPosts();

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
            <Link
              href="/admin/posts/new"
              className="shrink-0 text-sm font-semibold text-black underline decoration-black/25 underline-offset-4 transition-colors duration-300 ease-in-out hover:decoration-black/60 dark:text-white dark:decoration-white/35 dark:hover:decoration-white/70"
            >
              새 글 쓰기
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <section className="space-y-2">
            <h2 className="font-semibold text-black dark:text-white">
              작성된 글
            </h2>
            <ul className="flex flex-col">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/admin/posts/${post.slug}`}
                    className="group flex min-h-9 items-center justify-between gap-4 rounded-lg py-1.5 transition-colors duration-300 ease-in-out"
                  >
                    <span className="min-w-0 flex-1 truncate pr-4 text-black/75 transition-colors duration-300 ease-in-out group-hover:text-black group-hover:underline group-hover:decoration-black/25 dark:text-white/90 dark:group-hover:text-white dark:group-hover:decoration-white/50">
                      {post.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm text-black/40 dark:text-white/40">
                      <span>수정/삭제</span>
                      {formatCompactDate(post.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>
    </Container>
  );
}
