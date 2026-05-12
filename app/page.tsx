import { Container } from "@/components/container";
import { GitHubIcon, InstagramIcon } from "@/components/icons";
import { HomeTagLink } from "@/components/home-tag-link";
import { PostRow } from "@/components/post-row";
import { Reveal } from "@/components/reveal";
import { SiteSectionContent } from "@/components/site-section-content";
import { SiteLink } from "@/components/site-link";
import { getHomePostTags, getPublishedPosts } from "@/lib/posts";
import { getSiteSection } from "@/lib/supabase-site-sections";

export default async function Home() {
  const [latestPosts, tags, introSection, contactsSection] = await Promise.all([
    getPublishedPosts(),
    getHomePostTags(),
    getSiteSection("intro"),
    getSiteSection("contacts"),
  ]);

  return (
    <Container>
      <div className="space-y-16">
        <Reveal>
          <section>
            <SiteSectionContent
              body={introSection.body}
              className="text-black/75 dark:text-white/90"
            />
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
            <ul className="flex flex-wrap justify-start gap-x-4 gap-y-2">
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
            <SiteSectionContent
              body={contactsSection.body}
              className="text-black/75 dark:text-white/90"
            />
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
