import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { splitSectionParagraphs } from "@/lib/site-sections";
import { getSiteSection } from "@/lib/supabase-site-sections";

export const metadata: Metadata = {
  title: "About",
  description: "이 블로그에 대한 간단한 소개입니다.",
};

export default async function AboutPage() {
  const section = await getSiteSection("about");

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <h1 className="font-semibold text-black dark:text-white">About</h1>
        </Reveal>

        <Reveal delay={120}>
          <article className="article space-y-4 text-black/75 dark:text-white/90">
            {splitSectionParagraphs(section.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        </Reveal>
      </div>
    </Container>
  );
}
