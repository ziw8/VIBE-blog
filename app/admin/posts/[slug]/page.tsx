import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { getPost, getPublishedPostTags } from "@/lib/posts";
import { getStoredPost } from "@/lib/supabase-posts";

type AdminPostEditPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Post",
  description: "게시글 수정 페이지입니다.",
};

export default async function AdminPostEditPage({
  params,
}: AdminPostEditPageProps) {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const { slug } = await params;
  const storedPost = await getStoredPost(slug);
  const staticPost = storedPost ? null : getPost(slug);
  const post = storedPost
    ? {
        slug: storedPost.slug,
        title: storedPost.title,
        tags: storedPost.tags,
        contentHtml: storedPost.content_html,
      }
    : staticPost
      ? {
          slug: staticPost.slug,
          title: staticPost.title,
          tags: staticPost.tags,
          contentHtml: staticPost.contentHtml ?? "",
        }
      : null;

  if (!post) {
    notFound();
  }

  const tags = Array.from(
    new Set([...(await getPublishedPostTags()), ...post.tags]),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="space-y-2">
            <p className="text-sm text-black/50 dark:text-white/50">
              글 수정
            </p>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {post.title}
            </h1>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminPostEditor
            tags={tags}
            post={post}
          />
        </Reveal>
      </div>
    </Container>
  );
}
