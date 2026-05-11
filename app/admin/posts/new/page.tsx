import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { getPublishedPostTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "New Post",
  description: "새 게시글 작성 페이지입니다.",
};

export default async function AdminNewPostPage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const tags = await getPublishedPostTags();

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="space-y-2">
            <p className="text-sm text-black/50 dark:text-white/50">
              글쓰기
            </p>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              새 글 작성
            </h1>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminPostEditor tags={tags} />
        </Reveal>
      </div>
    </Container>
  );
}
