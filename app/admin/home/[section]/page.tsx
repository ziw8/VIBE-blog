import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSiteSectionEditor } from "@/components/admin-site-section-editor";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { isSiteSectionKey } from "@/lib/site-sections";
import { getSiteSection } from "@/lib/supabase-site-sections";

type AdminHomeSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Home Section",
  description: "첫 페이지 섹션 수정 페이지입니다.",
};

export default async function AdminHomeSectionPage({
  params,
}: AdminHomeSectionPageProps) {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const { section: sectionParam } = await params;

  if (!isSiteSectionKey(sectionParam)) {
    notFound();
  }

  const section = await getSiteSection(sectionParam);

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-black/50 dark:text-white/50">
                첫 페이지 관리
              </p>
              <h1 className="text-2xl font-semibold text-black dark:text-white">
                {section.title} 수정
              </h1>
            </div>
            <Link
              href="/admin/home"
              className="shrink-0 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
            >
              {"<- First page"}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminSiteSectionEditor
            body={section.body}
            sectionKey={section.key}
          />
        </Reveal>
      </div>
    </Container>
  );
}
