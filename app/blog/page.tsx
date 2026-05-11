import type { Metadata } from "next";
import { BlogViewTabs } from "./blog-view-tabs";
import { Container } from "@/components/container";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Posts",
  description: "기록한 글을 모아둔 목록입니다.",
};

export default async function BlogPage() {
  const posts = (await getPublishedPosts()).map(
    ({ date, slug, tags, title, updatedAt }) => ({
      date,
      slug,
      tags,
      title,
      updatedAt,
    }),
  );

  return (
    <Container>
      <BlogViewTabs posts={posts} />
    </Container>
  );
}
