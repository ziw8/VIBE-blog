import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { splitSectionParagraphs, type SiteSection } from "@/lib/site-sections";
import {
  getSiteSections,
  isMissingSiteSectionsTableError,
} from "@/lib/supabase-site-sections";

export const metadata: Metadata = {
  title: "Admin Home",
  description: "첫 페이지 관리 페이지입니다.",
};

export default async function AdminHomePage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  let sections: SiteSection[];
  let setupRequired = false;

  try {
    sections = await getSiteSections({ throwOnMissing: true });
  } catch (error) {
    if (isMissingSiteSectionsTableError(error as { code?: string; message?: string })) {
      setupRequired = true;
      sections = [];
    } else {
      throw error;
    }
  }

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-black/50 dark:text-white/50">
                관리자
              </p>
              <h1 className="text-2xl font-semibold text-black dark:text-white">
                첫 페이지 관리
              </h1>
            </div>
            <Link
              href="/admin"
              className="shrink-0 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
            >
              {"<- Admin"}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {setupRequired ? (
            <p className="border-t border-black/10 pt-4 text-black/60 dark:border-white/15 dark:text-white/60">
              Supabase 첫 페이지 관리 설정이 필요합니다.
              supabase/site-sections.sql을 실행해주세요.
            </p>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => (
                <section
                  key={section.key}
                  className="border-t border-black/10 pt-4 dark:border-white/15"
                >
                  <Link
                    href={`/admin/home/${section.key}`}
                    className="font-semibold text-black underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:decoration-black/35 dark:text-white dark:decoration-white/30 dark:hover:decoration-white/50"
                  >
                    {section.title} 수정
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/55 dark:text-white/55">
                    {splitSectionParagraphs(section.body).join(" ")}
                  </p>
                </section>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </Container>
  );
}
