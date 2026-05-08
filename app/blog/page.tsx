import type { Metadata } from "next";
import { BlogViewTabs } from "./blog-view-tabs";
import { Container } from "@/components/container";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Posts",
  description: "기록한 글을 모아둔 목록입니다.",
};

export default function BlogPage() {
  const posts = getPosts().map(({ date, slug, tags, title }) => ({
    date,
    slug,
    tags,
    title,
  }));

  return (
    <Container>
      <BlogViewTabs posts={posts} />
    </Container>
  );
}
