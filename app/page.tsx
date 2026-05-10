import { Container } from "@/components/container";
import { GitHubIcon, InstagramIcon } from "@/components/icons";
import { HomeTagLink } from "@/components/home-tag-link";
import { PostRow } from "@/components/post-row";
import { Reveal } from "@/components/reveal";
import { SiteLink } from "@/components/site-link";
import { getPosts } from "@/lib/posts";

export default function Home() {
  const latestPosts = getPosts();
  const tags = Array.from(new Set(latestPosts.flatMap((post) => post.tags)));

  return (
    <Container>
      <div className="space-y-16">
        <Reveal>
          <section>
            <article className="article space-y-4">
              <p>
                소프트웨어와 디자인, 그리고 일하면서 떠오른 생각을 짧게
                기록하는 공간입니다.
              </p>
              <p>
                글을 빠르게 훑고 편하게 읽을 수 있도록 화면은 조용하게
                유지합니다.
              </p>
            </article>
          </section>
        </Reveal>

        <Reveal delay={120}>
          <section className="space-y-2">
            <h2 className="font-semibold text-black dark:text-white">
              Recent posts
            </h2>
            <ul className="flex flex-col">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <PostRow post={post} />
                </li>
              ))}
            </ul>
            <SiteLink href="/blog">more -&gt;</SiteLink>
          </section>
        </Reveal>

        <Reveal delay={240}>
          <section className="space-y-2">
            <h2 className="font-semibold text-black dark:text-white">
              Tags
            </h2>
            <ul className="flex flex-wrap justify-between gap-x-4 gap-y-2">
              {tags.map((tag) => (
                <li key={tag} className="text-black/75 dark:text-white/90">
                  <HomeTagLink tag={tag} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal delay={360}>
          <section className="space-y-2">
            <h2 className="font-semibold text-black dark:text-white">
              Contacts
            </h2>
            <p className="text-black/75 dark:text-white/90">
              안녕하세요. 이지우입니다.
            </p>
            <ul className="flex flex-wrap gap-2">
              <li>
                <SiteLink
                  href="https://www.instagram.com/qziw8/"
                  underline={false}
                  aria-label="Instagram @qziw8"
                  className="inline-flex size-6 items-center justify-center text-black dark:text-white"
                >
                  <InstagramIcon />
                </SiteLink>
              </li>
              <li>
                <SiteLink
                  href="https://github.com/ziw8"
                  underline={false}
                  aria-label="GitHub ziw8"
                  className="inline-flex size-6 items-center justify-center text-black dark:text-white"
                >
                  <GitHubIcon />
                </SiteLink>
              </li>
            </ul>
          </section>
        </Reveal>
      </div>
    </Container>
  );
}
