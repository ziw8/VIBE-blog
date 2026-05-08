import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { getPost, getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      images: ["/astro-nano.png"],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <Container>
      <Reveal>
        <BackLink fallbackHref="/blog" />
      </Reveal>

      <div className="my-10 space-y-1">
        <Reveal delay={120}>
          <div className="flex items-center gap-1.5 text-sm">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">&bull;</span>
            <span>{post.readingTime}</span>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            {post.title}
          </h1>
        </Reveal>
      </div>

      <Reveal delay={280}>
        <article className="article">{post.content}</article>
      </Reveal>
    </Container>
  );
}
