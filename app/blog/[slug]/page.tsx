import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentEmojiSummaryLoader, Comments } from "@/components/comments";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { SiteLink } from "@/components/site-link";
import { getPublishedPost, getPublishedPosts } from "@/lib/posts";
import { formatDottedDate } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function normalizeSlugParam(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(normalizeSlugParam(slug));

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
  const post = await getPublishedPost(normalizeSlugParam(slug));

  if (!post) {
    notFound();
  }

  return (
    <Container>
      <div className="mb-10">
        <Reveal delay={120}>
          <div className="flex items-start justify-between gap-4 text-sm">
            <p className="min-w-0 flex-1 text-black/50 dark:text-white/50">
              {post.tags.join(" / ")}
            </p>
            <time
              dateTime={post.date}
              className="shrink-0 text-right text-black/40 dark:text-white/40"
            >
              {formatDottedDate(post.date)}
            </time>
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-4">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            {post.title}
          </h1>
        </Reveal>
      </div>

      <Reveal delay={280}>
        {post.contentHtml ? (
          <article
            className="article"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : (
          <article className="article">{post.content}</article>
        )}
      </Reveal>

      <Reveal delay={360}>
        <div className="mt-12 space-y-4">
          <CommentEmojiSummaryLoader postSlug={post.slug} />
          <SiteLink
            href="/blog"
            className="text-sm text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            {"<- Back to posts"}
          </SiteLink>
        </div>
      </Reveal>

      <Reveal delay={440}>
        <section className="mt-8">
          <Comments postSlug={post.slug} />
        </section>
      </Reveal>
    </Container>
  );
}
