import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PostRow } from "@/components/post-row";
import { Reveal } from "@/components/reveal";
import { getPosts } from "@/lib/posts";
import { groupByYear } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "기록한 글을 모아둔 목록입니다.",
};

export default function BlogPage() {
  const groupedPosts = groupByYear(getPosts());
  const years = Object.keys(groupedPosts).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <h1 className="font-semibold text-black dark:text-white">Blog</h1>
        </Reveal>

        <div className="space-y-8">
          {years.map((year, index) => (
            <Reveal key={year} delay={120 + index * 100}>
              <section className="space-y-2">
                <h2 className="font-semibold text-black dark:text-white">
                  {year}
                </h2>
                <ul className="flex flex-col">
                  {groupedPosts[year].map((post) => (
                    <li key={post.slug}>
                      <PostRow post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  );
}
